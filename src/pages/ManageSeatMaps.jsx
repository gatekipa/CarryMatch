import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Plus, Edit, Trash2, ArrowLeft, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SeatMapEditor from "../components/bus/SeatMapEditor";
import SeatMapPreview from "../components/bus/SeatMapPreview";

const PRESET_TEMPLATES = {
  "2x2_standard": {
    name: "2x2 Standard (32 seats)",
    rows: 8,
    columns: 4,
    layout: [[1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1]],
    seatClasses: {},
    description: "Standard 32-seat configuration with center aisle"
  },
  "2x3_economy": {
    name: "2x3 Economy (40 seats)",
    rows: 8,
    columns: 5,
    layout: [[1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1], [1,1,0,1,1,1]],
    seatClasses: {},
    description: "High-capacity 40-seat economy configuration"
  },
  "vip_luxury": {
    name: "VIP Luxury (24 seats)",
    rows: 6,
    columns: 4,
    layout: [[1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1], [1,1,0,1,1]],
    seatClasses: {
      "A1": "vip", "A2": "vip", "A3": "vip", "A4": "vip",
      "B1": "vip", "B2": "vip", "B3": "vip", "B4": "vip"
    },
    description: "Luxury VIP configuration with spacious seating"
  }
};

export default function ManageSeatMaps() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [formData, setFormData] = useState({
    template_name: "",
    layout_json: { rows: 8, columns: 4, layout: [], seatClasses: {} },
    default_seat_class_rules_json: {
      vip_multiplier: 1.3,
      front_row_premium: 0
    }
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['seat-map-templates', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return await base44.entities.SeatMapTemplate.update(editingTemplate.id, data);
      }
      return await base44.entities.SeatMapTemplate.create({
        ...data,
        operator_id: operator.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat-map-templates'] });
      toast.success(editingTemplate ? "Template updated!" : "Template created!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SeatMapTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat-map-templates'] });
      toast.success("Template deleted");
    }
  });

  const resetForm = () => {
    setFormData({
      template_name: "",
      layout_json: { rows: 8, columns: 4, layout: [], seatClasses: {} },
      default_seat_class_rules_json: {
        vip_multiplier: 1.3,
        front_row_premium: 0
      }
    });
    setEditingTemplate(null);
    setShowEditor(false);
  };

  const loadPreset = (presetKey) => {
    const preset = PRESET_TEMPLATES[presetKey];
    setFormData({
      ...formData,
      template_name: preset.name,
      layout_json: {
        rows: preset.rows,
        columns: preset.columns,
        layout: preset.layout,
        seatClasses: preset.seatClasses
      }
    });
    setShowEditor(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      layout_json: template.layout_json,
      default_seat_class_rules_json: template.default_seat_class_rules_json || {
        vip_multiplier: 1.3,
        front_row_premium: 0
      }
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.template_name) {
      toast.error("Please enter a template name");
      return;
    }
    if (!formData.layout_json.layout || formData.layout_json.layout.length === 0) {
      toast.error("Please create a seat layout");
      return;
    }
    createMutation.mutate(formData);
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => resetForm()}
            className="mb-6 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Editor */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingTemplate ? "Edit Template" : "Create Template"}
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="text-gray-300">Template Name</Label>
                  <Input
                    value={formData.template_name}
                    onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                    placeholder="e.g., VIP 2x2 32 seats"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <SeatMapEditor
                  layout={formData.layout_json}
                  onChange={(layout) => setFormData({...formData, layout_json: layout})}
                />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pricing Rules</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">VIP Class Multiplier</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          value={formData.default_seat_class_rules_json.vip_multiplier}
                          onChange={(e) => setFormData({
                            ...formData,
                            default_seat_class_rules_json: {
                              ...formData.default_seat_class_rules_json,
                              vip_multiplier: parseFloat(e.target.value)
                            }
                          })}
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-gray-400 text-sm">x base price</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">VIP seats will cost {formData.default_seat_class_rules_json.vip_multiplier}x the base price</p>
                    </div>

                    <div>
                      <Label className="text-gray-300">Front Row Premium (XAF)</Label>
                      <Input
                        type="number"
                        step="500"
                        min="0"
                        value={formData.default_seat_class_rules_json.front_row_premium}
                        onChange={(e) => setFormData({
                          ...formData,
                          default_seat_class_rules_json: {
                            ...formData.default_seat_class_rules_json,
                            front_row_premium: parseInt(e.target.value)
                          }
                        })}
                        className="bg-white/5 border-white/10 text-white mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Extra charge for front row seats</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
                </Button>
              </div>
            </Card>

            {/* Preview */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Preview</h2>
              <SeatMapPreview
                layout={formData.layout_json}
                pricingRules={formData.default_seat_class_rules_json}
                basePrice={5000}
              />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bus Types & Seat Maps</h1>
            <p className="text-gray-400">Create seat map templates for your vehicles</p>
          </div>
          <Button
            onClick={() => setShowEditor(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Preset Templates */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Start: Choose a Preset</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
              <Card key={key} className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={() => loadPreset(key)}>
                <div className="flex items-start justify-between mb-4">
                  <Bus className="w-8 h-8 text-blue-400" />
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {preset.rows * preset.columns - preset.layout.flat().filter(s => s === 0).length} seats
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{preset.name}</h3>
                <p className="text-sm text-gray-400">{preset.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Existing Templates */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Templates</h2>
          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </Card>
          ) : templates.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold text-white mb-2">No Templates Yet</h3>
              <p className="text-gray-400">Create your first seat map template to get started</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
                const totalSeats = template.layout_json.layout.flat().filter(s => s === 1).length;
                const vipSeats = Object.values(template.layout_json.seatClasses || {}).filter(c => c === 'vip').length;
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <Bus className="w-8 h-8 text-blue-400" />
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {totalSeats} seats
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-2">{template.template_name}</h3>
                      
                      <div className="flex gap-2 mb-4">
                        {vipSeats > 0 && (
                          <Badge className="bg-purple-500/20 text-purple-400">
                            {vipSeats} VIP
                          </Badge>
                        )}
                        <Badge className="bg-green-500/20 text-green-400">
                          {totalSeats - vipSeats} Standard
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                          className="flex-1 border-white/10"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Delete this template?")) {
                              deleteMutation.mutate(template.id);
                            }
                          }}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}