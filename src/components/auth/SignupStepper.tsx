const STEPS = ['Your details', 'Company', 'Modules'];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SignupStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="signup-stepper">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isCurrent = stepNum === current;
        return (
          <div key={label} className={`signup-stepper-step${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
            <div className="signup-stepper-circle">{isDone ? <CheckIcon /> : stepNum}</div>
            <span className="signup-stepper-label">{label}</span>
            {i < STEPS.length - 1 && <div className={`signup-stepper-line${isDone ? ' done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}
