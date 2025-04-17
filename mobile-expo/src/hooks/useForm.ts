import { useState, useCallback } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], formValues: T) => string | null;
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormResult<T> {
  values: T;
  errors: FormErrors<T>;
  touched: { [K in keyof T]?: boolean };
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  reset: () => void;
  isValid: boolean;
  validateForm: () => boolean;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});

  const validateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]): string | null => {
      if (!validationRules || !validationRules[field]) {
        return null;
      }
      return validationRules[field]!(value, values);
    },
    [validationRules, values]
  );

  const handleChange = useCallback(
    <K extends keyof T>(field: K) => (value: T[K]) => {
      setValues((prevValues) => ({ ...prevValues, [field]: value }));
      
      const error = validateField(field, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: error,
      }));
      
      // Set field as touched when value changes
      setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
    },
    [validateField]
  );

  const handleBlur = useCallback(
    <K extends keyof T>(field: K) => () => {
      // Blur is no longer needed for validation
    },
    []
  );

  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prevValues) => ({ ...prevValues, [field]: value }));
      
      const error = validateField(field, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: error,
      }));
    },
    [validateField]
  );

  const validateForm = useCallback((): boolean => {
    if (!validationRules) {
      return true;
    }

    const newErrors: FormErrors<T> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const field = key as keyof T;
      const error = validateField(field, values[field]);
      
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.values(errors).every((error) => !error);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    reset,
    isValid,
    validateForm,
  };
}
