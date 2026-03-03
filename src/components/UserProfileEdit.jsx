import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Plus, 
  Globe, 
  Plane,
  Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const commonLanguages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian",
  "Turkish", "Dutch", "Swedish", "Polish", "Vietnamese", "Thai"
];

const travelPreferenceOptions = [
  "Window seat preferred",
  "Aisle seat preferred", 
  "Enjoys scenic routes",
  "Flexible with dates",
  "Prefers direct flights",
  "Early morning traveler",
  "Late night traveler",
  "Frequent flyer",
  "First time international",
  "Business traveler",
  "Leisure traveler",
  "Budget conscious",
  "Premium service preferred"
];

export default function UserProfileEdit({ user, editedProfile, setEditedProfile, onSave, onCancel, isSaving }) {
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [showPreferenceSelector, setShowPreferenceSelector] = useState(false);

  const handleAddLanguage = (lang) => {
    const languages = editedProfile.languages_spoken || [];
    if (lang && !languages.includes(lang)) {
      setEditedProfile({
        ...editedProfile,
        languages_spoken: [...languages, lang]
      });
    }
    setNewLanguage("");
    setShowLanguageInput(false);
  };

  const handleRemoveLanguage = (lang) => {
    const languages = editedProfile.languages_spoken || [];
    setEditedProfile({
      ...editedProfile,
      languages_spoken: languages.filter(l => l !== lang)
    });
  };

  const handleAddPreference = (pref) => {
    const prefs = editedProfile.travel_preferences || [];
    if (pref && !prefs.includes(pref)) {
      setEditedProfile({
        ...editedProfile,
        travel_preferences: [...prefs, pref]
      });
    }
  };

  const handleRemovePreference = (pref) => {
    const prefs = editedProfile.travel_preferences || [];
    setEditedProfile({
      ...editedProfile,
      travel_preferences: prefs.filter(p => p !== pref)
    });
  };

  const availablePreferences = travelPreferenceOptions.filter(
    pref => !(editedProfile.travel_preferences || []).includes(pref)
  );

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Location</Label>
            <Input
              value={editedProfile.location || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
              placeholder="City, Country"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 mb-2 block">Phone</Label>
            <Input
              value={editedProfile.phone || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 mb-2 block">Bio</Label>
            <Textarea
              value={editedProfile.bio || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
            />
          </div>
        </div>
      </Card>

      {/* Languages */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Languages</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLanguageInput(!showLanguageInput)}
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <AnimatePresence>
          {showLanguageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex gap-2 mb-3">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage(newLanguage)}
                  placeholder="Enter language..."
                  className="bg-white/5 border-white/10 text-white flex-1"
                />
                <Button
                  onClick={() => handleAddLanguage(newLanguage)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonLanguages
                  .filter(lang => !(editedProfile.languages_spoken || []).includes(lang))
                  .map(lang => (
                    <Badge
                      key={lang}
                      onClick={() => handleAddLanguage(lang)}
                      className="bg-white/10 text-gray-300 hover:bg-blue-500 hover:text-white cursor-pointer transition-all"
                    >
                      {lang}
                    </Badge>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          {(editedProfile.languages_spoken || []).length === 0 ? (
            <p className="text-gray-500 text-sm italic">No languages added yet</p>
          ) : (
            (editedProfile.languages_spoken || []).map(lang => (
              <Badge
                key={lang}
                className="bg-blue-500/20 text-blue-300 border border-blue-500/30 pr-1"
              >
                {lang}
                <button
                  onClick={() => handleRemoveLanguage(lang)}
                  className="ml-2 p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </Card>

      {/* Travel Preferences */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Travel Preferences</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferenceSelector(!showPreferenceSelector)}
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <AnimatePresence>
          {showPreferenceSelector && availablePreferences.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 max-h-48 overflow-y-auto">
                <div className="grid sm:grid-cols-2 gap-2">
                  {availablePreferences.map(pref => (
                    <button
                      key={pref}
                      onClick={() => handleAddPreference(pref)}
                      className="text-left p-2 rounded hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-all"
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          {(editedProfile.travel_preferences || []).length === 0 ? (
            <p className="text-gray-500 text-sm italic">No travel preferences added yet</p>
          ) : (
            (editedProfile.travel_preferences || []).map(pref => (
              <Badge
                key={pref}
                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 pr-1"
              >
                {pref}
                <button
                  onClick={() => handleRemovePreference(pref)}
                  className="ml-2 p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </Card>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-white/10 text-gray-300 hover:text-white"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}