import React, { useState } from 'react';

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);

  const steps = [
    <div key="welcome" data-testid="onboarding-welcome">
      <h2>Welcome to Acadex Mini!</h2>
      <button aria-label="wizard-next" onClick={() => setStep(1)}>Continue</button>
    </div>,
    <div key="create-class" data-testid="onboarding-create-class">
      <h2>Create Your First Class</h2>
      <input aria-label="class-name" placeholder="Class Name" />
      <input aria-label="class-description" placeholder="Description" />
      <button aria-label="wizard-next" onClick={() => setStep(2)}>Next</button>
    </div>,
    <div key="assignment-wizard" data-testid="onboarding-create-assignment">
      <h2>Assignment Wizard (Step 1/6)</h2>
      {/* ...repeat for 6 steps... */}
      <button aria-label="wizard-next" onClick={() => setStep(3)}>Next</button>
    </div>,
    <div key="upsell" data-testid="onboarding-plan-upsell">
      <h2>Choose Your Plan</h2>
      <button>Free</button>
      <button>Bronze</button>
      <button>Silver</button>
      <button>Gold</button>
      <button aria-label="wizard-next" onClick={() => setStep(4)}>Continue</button>
    </div>,
    <div key="student-creation" data-testid="onboarding-student-creation">
      <h2>Add Students</h2>
      <button>Manual</button>
      <button>QR</button>
      <button aria-label="wizard-next" onClick={() => setStep(5)}>Finish</button>
    </div>,
    <div key="tour" data-testid="onboarding-tour">
      <h2>Guided Tour</h2>
      <p>Floating arrows and highlights...</p>
      <button aria-label="wizard-next" onClick={() => alert('Tour Complete!')}>Done</button>
    </div>
  ];

  return (
    <div>
      {steps[step]}
    </div>
  );
}
