export function renderStepper(steps, currentStep) {
  const items = steps
    .map((step, index) => {
      const state = index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending';
      const icon = state === 'completed' ? '✓' : state === 'current' ? '➜' : '○';
      return `<span class="step-item step-${state}">${icon} ${step}</span>`;
    })
    .join('');

  return `
    <div class="stepper-card">
      <div class="stepper-line"></div>
      <div class="stepper-content">${items}</div>
    </div>
  `;
}

export function renderLoading(message = 'Carregando...') {
  return `
    <div class="loading-inline">
      <div class="spinner small"></div>
      <span>${message}</span>
    </div>
  `;
}

export function renderAlert(message) {
  return `<div class="alert-message">${message}</div>`;
}
