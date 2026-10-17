export function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const triggers = [...accordion.querySelectorAll('.acc-trigger')];

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        trigger.closest('.acc-item').classList.toggle('is-open', !expanded);
      });

      trigger.addEventListener('keydown', (e) => {
        const moves = {
          ArrowDown: (index + 1) % triggers.length,
          ArrowUp: (index - 1 + triggers.length) % triggers.length,
          Home: 0,
          End: triggers.length - 1,
        };
        if (e.key in moves) {
          e.preventDefault();
          triggers[moves[e.key]].focus();
        }
      });
    });
  });
}
