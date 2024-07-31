import React from "react";

type ActionButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  btnText: string;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  btnText,
  disabled = false,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {btnText}
    </button>
  );
};

export default ActionButton;
