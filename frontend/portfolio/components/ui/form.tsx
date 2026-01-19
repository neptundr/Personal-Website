'use client';

import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {
    Controller,
    FormProvider,
    useFormContext,
    type FieldValues,
    type ControllerProps
} from "react-hook-form";
import {cn} from "@/lib/utils";
import {Label} from "@/components/ui/label";

// --- Form Provider ---
const Form = FormProvider;

// --- Form Field Context ---
interface FormFieldContextValue {
    name: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

// --- Form Field ---
interface FormFieldProps<TFieldValues extends FieldValues> extends ControllerProps<TFieldValues> {
}

const FormField = <TFieldValues extends FieldValues>({
                                                         ...props
                                                     }: FormFieldProps<TFieldValues>) => {
    // @ts-ignore
    return (
        <FormFieldContext.Provider value={{name: props.name as string}}>
            <Controller {...props} render={() => "null"}/>
        </FormFieldContext.Provider>
    );
};

// --- Form Item Context ---
interface FormItemContextValue {
    id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
    ({className, ...props}, ref) => {
        const id = React.useId();
        return (
            <FormItemContext.Provider value={{id}}>
                <div ref={ref} className={cn("space-y-2", className)} {...props} />
            </FormItemContext.Provider>
        );
    }
);
FormItem.displayName = "FormItem";

// --- useFormField Hook ---
const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const {getFieldState, formState} = useFormContext();

    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }
    if (!itemContext) {
        throw new Error("useFormField should be used within <FormItem>");
    }

    const fieldState = getFieldState(fieldContext.name, formState);

    return {
        id: itemContext.id,
        name: fieldContext.name,
        formItemId: `${itemContext.id}-form-item`,
        formDescriptionId: `${itemContext.id}-form-item-description`,
        formMessageId: `${itemContext.id}-form-item-message`,
        ...fieldState,
    };
};

// --- FormLabel ---
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
    ({className, ...props}, ref) => {
        const {error, formItemId} = useFormField();
        return (
            <Label
                ref={ref}
                htmlFor={formItemId}
                className={cn(error && "text-destructive", className)}
                {...props}
            />
        );
    }
);
FormLabel.displayName = "FormLabel";

// --- FormControl ---
interface FormControlProps extends React.ComponentPropsWithoutRef<typeof Slot> {
}

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, FormControlProps>(
    ({...props}, ref) => {
        const {error, formItemId, formDescriptionId, formMessageId} = useFormField();
        return (
            <Slot
                ref={ref}
                id={formItemId}
                aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
                aria-invalid={!!error}
                {...props}
            />
        );
    }
);
FormControl.displayName = "FormControl";

// --- FormDescription ---
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
    ({className, ...props}, ref) => {
        const {formDescriptionId} = useFormField();
        return (
            <p
                ref={ref}
                id={formDescriptionId}
                className={cn("text-[0.8rem] text-muted-foreground", className)}
                {...props}
            />
        );
    }
);
FormDescription.displayName = "FormDescription";

// --- FormMessage ---
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children?: React.ReactNode;
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
    ({className, children, ...props}, ref) => {
        const {error, formMessageId} = useFormField();
        const body = error ? String(error?.message) : children;

        if (!body) return null;

        return (
            <p
                ref={ref}
                id={formMessageId}
                className={cn("text-[0.8rem] font-medium text-destructive", className)}
                {...props}
            >
                {body}
            </p>
        );
    }
);
FormMessage.displayName = "FormMessage";

// --- Export ---
export {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    useFormField,
};