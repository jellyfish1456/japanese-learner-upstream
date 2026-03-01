interface ModeOption {
  value: string;
  label: string;
  description: string;
}

interface ModeSelectorProps {
  modes: ModeOption[];
  selected: string | string[];
  onChange: (modes: string | string[]) => void;
}

export default function ModeSelector({ modes, selected, onChange }: ModeSelectorProps) {
  // Separate concrete modes from "random"
  const concreteModes = modes.filter((m) => m.value !== "random");
  const randomMode = modes.find((m) => m.value === "random");
  const concreteValues = concreteModes.map((m) => m.value);

  // Normalize selected to work with both string and string[]
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected]);
  const isRandom = selectedSet.has("random");
  const isAllSelected =
    !isRandom && concreteValues.length > 0 && concreteValues.every((v) => selectedSet.has(v));

  const toggleMode = (value: string) => {
    if (value === "random") {
      // Random is mutually exclusive with concrete modes
      onChange("random");
      return;
    }

    // Clicking a concrete mode — deselect random if active
    const currentConcrete = isRandom ? [] : concreteValues.filter((v) => selectedSet.has(v));

    // Toggle and always maintain canonical order from concreteValues
    const newSet = new Set(currentConcrete);
    if (newSet.has(value)) {
      newSet.delete(value);
      if (newSet.size === 0) return; // At least one required
    } else {
      newSet.add(value);
    }
    const next = concreteValues.filter((v) => newSet.has(v));
    onChange(next.length === 1 ? next[0] : next);
  };

  const toggleAll = () => {
    if (isAllSelected) {
      // Deselect all → fall back to first concrete mode
      onChange(concreteValues[0]);
    } else {
      // Select all concrete modes
      onChange(concreteValues);
    }
  };

  const chipBase =
    "px-3 py-2 rounded-xl text-sm font-medium transition-colors tap-active whitespace-nowrap";
  const chipActive = "bg-gray-900 dark:bg-white text-white dark:text-gray-900";
  const chipInactive =
    "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

  return (
    <div className="flex flex-wrap gap-2">
      {/* All mode chip */}
      <button
        type="button"
        onClick={toggleAll}
        className={`${chipBase} ${isAllSelected ? chipActive : chipInactive}`}
        title="選擇綜合模式模式"
        data-testid="mode-chip-all"
      >
        綜合模式
      </button>

      {/* Concrete mode chips */}
      {concreteModes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => toggleMode(mode.value)}
          className={`${chipBase} ${
            !isRandom && selectedSet.has(mode.value) ? chipActive : chipInactive
          }`}
          title={mode.description}
          data-testid={`mode-chip-${mode.value}`}
        >
          {mode.label}
        </button>
      ))}

      {/* Random chip — mutually exclusive */}
      {randomMode && (
        <button
          type="button"
          onClick={() => toggleMode("random")}
          className={`${chipBase} ${isRandom ? chipActive : chipInactive}`}
          title={randomMode.description}
          data-testid="mode-chip-random"
        >
          {randomMode.label}
        </button>
      )}
    </div>
  );
}
