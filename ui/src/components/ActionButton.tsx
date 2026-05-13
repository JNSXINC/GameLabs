import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  variant?: "primary" | "warning" | "danger";
};

export default function ActionButton({
  children,
  onClick,
  disabled = false,
  style,
  variant = "primary",
}: Props) {
  const variantStyles = {
    primary: {
      background: "linear-gradient(90deg, #6ea8ff, #4d7fff)",
      border: "1px solid rgba(255,255,255,0.14)",
      boxShadow: "0 10px 22px rgba(77,127,255,0.28)",
    },
    warning: {
      background: "linear-gradient(90deg, #d9a441, #c8851f)",
      border: "1px solid rgba(255,210,120,0.18)",
      boxShadow: "0 10px 22px rgba(201,133,31,0.22)",
    },
    danger: {
      background: "linear-gradient(90deg, #d35a5a, #a93232)",
      border: "1px solid rgba(255,120,120,0.18)",
      boxShadow: "0 10px 22px rgba(169,50,50,0.24)",
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(0.97)";
          e.currentTarget.style.boxShadow = currentVariant.boxShadow;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = currentVariant.boxShadow;
        }
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = currentVariant.boxShadow;
          e.currentTarget.style.filter = "brightness(1.04)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = disabled ? "none" : currentVariant.boxShadow;
        e.currentTarget.style.filter = disabled ? "none" : "saturate(1.05)";
      }}
      style={{
        width: "100%",
        minHeight: "42px",
        borderRadius: "999px",
        border: disabled
          ? "1px solid rgba(255,255,255,0.08)"
          : currentVariant.border,
        background: disabled
          ? "rgba(255,255,255,0.06)"
          : currentVariant.background,
        color: disabled ? "rgba(255,255,255,0.35)" : "#ffffff",
        fontSize: "15px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, opacity 0.18s ease",
        boxShadow: disabled
          ? "none"
          : currentVariant.boxShadow,
        filter: disabled ? "none" : "saturate(1.05)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
