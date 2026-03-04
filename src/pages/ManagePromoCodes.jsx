import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag, Plus, Trash2, Edit, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ManagePromoCodes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    valid_from: "",
    valid_until: "",
    max_uses: "",
    usage_limit_per_user: "",
    applicable_routes_json: [],
    is_active: true
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['promo-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['promo-codes', operator?.id],
    queryFn: () => base44.entities.PromoCode.filter({ operator_id: operator.id }, "-created_date"),
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['promo-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const createPromoMutation = useMutation({
    mutationFn: async (data) => {
      const promoData = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        valid_from: data.valid_from || undefined,
        valid_until: data.valid_until || undefined,
        max_uses: data.max_uses ? parseInt(data.max_uses) : undefined,
        usage_limit_per_user: data.usage_limit_per_user ? parseInt(data.usage_limit_per_user) : undefined,
        applicable_routes_json: data.applicable_routes_json || [],
        is_active: data.is_active
      };
      
      if (editingPromo) {
        return await base44.entities.PromoCode.update(editingPromo.id, promoData);
      }
      return await base44.entities.PromoCode.create({
        ...promoData,
        operator_id: operator.id,
        current_uses: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success(editingPromo ? "Promo updated!" : "Promo code created!");
      resetForm();
    }
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success("Promo deleted");
    }
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      valid_from: "",
      valid_until: "",
      max_uses: "",
      usage_limit_per_user: "",
      applicable_routes_json: [],
      is_active: true
    });
    setEditingPromo(null);
    setShowDialog(false);
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData(promo);
    setShowDialog(true);
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
          <Tag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Promo Codes</h1>
            <p className="text-gray-400">Create and manage discount campaigns</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            New Promo Code
          </Button>
        </div>

        {promoCodes.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Tag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Promo Codes Yet</h3>
            <p className="text-gray-400">Create discount codes to attract more passengers</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {promoCodes.map((promo) => (
              <Card key={promo.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white font-mono">{promo.code}</h3>
                      <Badge className={promo.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-blue-400 font-semibold mb-2">
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}% OFF` 
                        : `${promo.discount_value} XAF OFF`}
                    </p>
                    <div className="text-sm text-gray-400 space-y-1">
                      {promo.valid_from && <p>Valid from: {format(new Date(promo.valid_from), "MMM d, yyyy")}</p>}
                      {promo.valid_until && <p>Valid until: {format(new Date(promo.valid_until), "MMM d, yyyy")}</p>}
                      <p>Used: {promo.current_uses} {promo.max_uses ? `/ ${promo.max_uses}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(promo)} className="border-white/10">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this promo code?")) {
                          deletePromoMutation.mutate(promo.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={() => resetForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., SUMMER2024"
                  className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Discount Type</Label>
                <RadioGroup value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="text-gray-300 cursor-pointer">Percentage (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="text-gray-300 cursor-pointer">Fixed Amount (XAF)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-gray-300">Discount Value *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                  placeholder={formData.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Valid From</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Max Total Uses</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value) : ""})}
                    placeholder="Leave blank for unlimited"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Max Uses Per User</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit_per_user}
                    onChange={(e) => setFormData({...formData, usage_limit_per_user: e.target.value ? parseInt(e.target.value) : ""})}
                    placeholder="Leave blank for unlimited"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
              </div>

              <Button
                onClick={() => createPromoMutation.mutate(formData)}
                disabled={!formData.code || !formData.discount_value || createPromoMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createPromoMutation.isPending ? "Saving..." : (editingPromo ? "Update" : "Create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}