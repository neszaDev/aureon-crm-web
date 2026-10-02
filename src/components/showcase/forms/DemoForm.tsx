'use client';

import { useState } from 'react';

/**
 * A demo form: submitting stays on the page, and the reset button restores every control
 * (native and custom) to its default by mounting the fields afresh.
 * @param props Component props.
 * @param props.className Extra classes for the form.
 * @param props.children Fields and the action buttons.
 * @returns The form.
 */
export const DemoForm = (props: { className?: string; children: React.ReactNode }) => {
  const [generation, setGeneration] = useState(0);

  return (
    <form
      className={props.className}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
      }}
      onReset={() => {
        setGeneration((current) => current + 1);
      }}
      key={generation}
    >
      {props.children}
    </form>
  );
};
