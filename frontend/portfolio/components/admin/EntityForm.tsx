'use client';

import * as React from 'react';
import {motion} from 'framer-motion';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {X, Save, Bold} from 'lucide-react';
import {useState, useRef} from "react";

/* ---------- types ---------- */

type FieldType =
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'date'
    | 'number'
    | 'boolean'
    | 'select'
    | 'array'
    | 'color';

export interface FieldOption {
    label: string;
    value: string;
}

export interface FieldConfig {
    key: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    description?: string;
    options?: FieldOption[];
}

interface EntityFormProps<T extends Record<string, any>> {
    title: string;
    fields: FieldConfig[];
    formData: T;
    setFormData: React.Dispatch<React.SetStateAction<T>>;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

/* ---------- RichTextArea — textarea with **bold** toggle ---------- */

const RichTextArea: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}> = ({value, onChange, placeholder}) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    const handleBold = () => {
        const el = ref.current;
        if (!el) return;
        const {selectionStart: start, selectionEnd: end} = el;
        const selected = value.slice(start, end);
        const before = value.slice(0, start);
        const after = value.slice(end);

        let newValue: string;
        let newStart: number;
        let newEnd: number;

        // Toggle off if already wrapped
        if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
            const inner = selected.slice(2, -2);
            newValue = before + inner + after;
            newStart = start;
            newEnd = start + inner.length;
        } else {
            newValue = before + `**${selected}**` + after;
            newStart = start + 2;
            newEnd = end + 2;
        }

        onChange(newValue);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newStart, newEnd);
        });
    };

    return (
        <div className="space-y-1">
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={handleBold}
                    title="Bold selected text (**text**)"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
                >
                    <Bold className="w-3 h-3"/>
                </button>
            </div>
            <textarea
                ref={ref}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[100px] rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-y font-mono"
            />
        </div>
    );
};

/* ---------- component ---------- */

export default function EntityForm<T extends Record<string, any>>({
                                                                      title,
                                                                      fields,
                                                                      formData,
                                                                      setFormData,
                                                                      onSubmit,
                                                                      onCancel,
                                                                      isLoading = false,
                                                                  }: EntityFormProps<T>) {
    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({...prev, [key]: value}));
    };

    const handleArrayChange = (key: string, value: string) => {
        const arr = value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        setFormData(prev => ({...prev, [key]: arr}));
    };

    const [skillsInput, setSkillsInput] = useState(
        (formData.skills ?? []).join(', ')
    );

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
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
                        <X className="w-5 h-5"/>
                    </Button>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        {fields.map(field => (
                            <div key={field.key}>
                                <Label className="text-white/80 mb-2 block">
                                    {field.label}
                                </Label>

                                {field.type === 'text' && (
                                    <Input
                                        value={formData[field.key] ?? ''}
                                        onChange={e =>
                                            handleChange(field.key, e.target.value)
                                        }
                                        placeholder={field.placeholder}
                                        className="bg-black border-white/10 text-white placeholder:text-white/30"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <Textarea
                                        value={formData[field.key] ?? ''}
                                        onChange={e =>
                                            handleChange(field.key, e.target.value)
                                        }
                                        placeholder={field.placeholder}
                                        className="bg-black border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                                    />
                                )}

                                {field.type === 'richtext' && (
                                    <RichTextArea
                                        value={formData[field.key] ?? ''}
                                        onChange={val => handleChange(field.key, val)}
                                        {...(field.placeholder !== undefined ? {placeholder: field.placeholder} : {})}
                                    />
                                )}

                                {field.type === 'date' && (
                                    <Input
                                        type="date"
                                        value={formData[field.key] ?? ''}
                                        onChange={e =>
                                            handleChange(field.key, e.target.value)
                                        }
                                        className="bg-black border-white/10 text-white"
                                    />
                                )}

                                {field.type === 'number' && (
                                    <Input
                                        type="number"
                                        value={formData[field.key] ?? ''}
                                        onChange={e =>
                                            handleChange(
                                                field.key,
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-black border-white/10 text-white"
                                    />
                                )}

                                {field.type === 'boolean' && (
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={Boolean(formData[field.key])}
                                            onCheckedChange={checked =>
                                                handleChange(field.key, checked)
                                            }
                                            className="data-[state=checked]:bg-red-500"
                                        />
                                        <span className="text-white/60 text-sm">
                      {field.description}
                    </span>
                                    </div>
                                )}

                                {field.type === 'select' && field.options && (
                                    <Select
                                        value={formData[field.key] ?? ''}
                                        onValueChange={value =>
                                            handleChange(field.key, value)
                                        }
                                    >
                                        <SelectTrigger className="bg-black border-white/10 text-white">
                                            <SelectValue
                                                placeholder={field.placeholder}
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            {field.options.map(opt => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="text-white"
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {field.type === 'array' && (
                                    <Input
                                        value={skillsInput}
                                        onChange={(e) => setSkillsInput(e.target.value)}
                                        onBlur={() => {
                                            const arr = skillsInput
                                                .split(',')
                                                .map((s: string) => s.trim())
                                                .filter(Boolean);

                                            setFormData(prev => ({...prev, skills: arr}));
                                        }}
                                        placeholder="React, TypeScript, Framer Motion"
                                    />
                                )}

                                {field.type === 'color' && (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={formData[field.key] ?? '#ffffff'}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0.5 bg-zinc-800"
                                        />
                                        <Input
                                            value={formData[field.key] ?? '#ffffff'}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            placeholder="#ffffff"
                                            className="bg-black border-white/10 text-white placeholder:text-white/30 font-mono w-32"
                                        />
                                        <span
                                            className="w-8 h-8 rounded-md border border-white/20 shrink-0"
                                            style={{backgroundColor: formData[field.key] ?? '#ffffff'}}
                                        />
                                    </div>
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
                                    <div
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2"/>
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
}