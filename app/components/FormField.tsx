"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: "text" | "number" | "textarea" | "array";
  readonly?: boolean;
}

export default function FormField({
  label,
  value,
  onChange,
  type = "text",
  readonly = false,
}: FormFieldProps) {
  // Format label to be more readable
  const formatLabel = (label: string) => {
    return label
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const renderField = () => {
    if (type === "array") {
      // For arrays, render as a bulleted list in a textarea
      const arrayValue = Array.isArray(value) ? value.join("\n• ") : "";
      return (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
          value={arrayValue ? `• ${arrayValue}` : ""}
          onChange={(e) => {
            const text = e.target.value;
            const items = text
              .split("\n")
              .map((item) => item.replace(/^•\s*/, "").trim())
              .filter((item) => item.length > 0);
            onChange(items);
          }}
          readOnly={readonly}
        />
      );
    } else if (type === "textarea") {
      return (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
        />
      );
    } else if (type === "number") {
      return (
        <input
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
        />
      );
    } else {
      return (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
        />
      );
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {formatLabel(label)}
      </label>
      {renderField()}
    </div>
  );
}
