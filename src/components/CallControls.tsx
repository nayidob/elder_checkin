"use client";

type Props = {
  onEndCall: () => void;
  disabled?: boolean;
  label?: string;
};

export function CallControls({ onEndCall, disabled, label }: Props) {
  return (
    <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-20 flex justify-center pb-6">
      <button
        type="button"
        onClick={onEndCall}
        disabled={disabled}
        className="flex h-14 min-w-[200px] items-center justify-center rounded-full bg-rose-600 px-6 text-base font-semibold text-white shadow-xl shadow-rose-400/40 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
      >
        {label ?? "🔴 End Call"}
      </button>
    </div>
  );
}

