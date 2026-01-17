import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';

const EntityForm = ({ title, fields, formData, setFormData, onSubmit, onCancel, isLoading }) => {
  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleArrayChange = (key, value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, [key]: arr });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-zinc-950 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <Label className="text-white/80 mb-2 block">{field.label}</Label>

                {field.type === 'text' && (
                  <Input
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                  />
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-black border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                  />
                )}

                {field.type === 'date' && (
                  <Input
                    type="date"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="bg-black border-white/10 text-white"
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, Number(e.target.value))}
                    placeholder={field.placeholder}
                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                  />
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData[field.key] || false}
                      onCheckedChange={(checked) => handleChange(field.key, checked)}
                      className="data-[state=checked]:bg-red-500"
                    />
                    <span className="text-white/60 text-sm">{field.description}</span>
                  </div>
                )}

                {field.type === 'select' && (
                  <Select
                    value={formData[field.key] || ''}
                    onValueChange={(value) => handleChange(field.key, value)}
                  >
                    <SelectTrigger className="bg-black border-white/10 text-white">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'array' && (
                  <Input
                    value={(formData[field.key] || []).join(', ')}
                    onChange={(e) => handleArrayChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EntityForm;