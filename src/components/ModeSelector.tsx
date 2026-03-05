interface ModeOption {
  value: string;
  label: string;
  description: string;
  group?: string;
}

interface ModeSelectorProps {
  modes: ModeOption[];
  selected: string | string[];
  onChange: (modes: string | string[]) => void;
  /** Show section labels grouped by mode.group (for mix datasets) */
  grouped?: boolean;
  /** Modes to fall back to when deselecting "全部模式". Defaults to first concrete mode. */
  defaultModes?: string[];
}

export default function ModeSelector({ modes, selected, onChange, grouped, defaultModes }: ModeSelectorProps) {
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
      // Deselect all → fall back to defaultModes or first concrete mode
      if (defaultModes && defaultModes.length > 0) {
        onChange(defaultModes.length === 1 ? defaultModes[0] : defaultModes);
      } else {
        onChange(concreteValues[0]);
      }
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

  // Group modes by their group property when grouped=true
  const groupLabels: Record<string, string> = { vocab: "詞彙", grammar: "文法" };
  const groups = grouped
    ? Array.from(new Set(concreteModes.map((m) => (m as ModeOption).group).filter(Boolean))) as string[]
    : null;

  const renderChip = (mode: ModeOption) => (
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
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* All mode chip */}
        <button
          type="button"
          onClick={toggleAll}
          className={`${chipBase} ${isAllSelected ? chipActive : chipInactive}`}
          title="選擇全部模式"
          data-testid="mode-chip-all"
        >
          全部模式
        </button>

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

      {/* Concrete mode chips — optionally grouped */}
      {groups ? (
        groups.map((group) => (
          <div key={group}>
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{groupLabels[group] ?? group}</div>
            <div className="flex flex-wrap gap-2">
              {concreteModes.filter((m) => (m as ModeOption).group === group).map(renderChip)}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-wrap gap-2">
          {concreteModes.map(renderChip)}
        </div>
      )}
    </div>
  );
}
