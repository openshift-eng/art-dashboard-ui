import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { NewContentChecklist } from "./new-content-checklist";
import NewContentForm from "./new-content-form";
import NewContentNote from "./new-content-note";
import { useNewContentState } from './new-content-state';
import React from "react";
import NewContentReview from "./new-content-review";
import NewContentDone from "./new-content-done";

export function NewContentStep({ activeStep }: { activeStep: number }) {
  switch (activeStep) {
    case 0:
      return (
        <Box sx={{ m: 4 }}>
          <Typography component="h1" variant="h4" sx={{ my: 2 }}>Step 1: Finish the following checklist</Typography>
          <NewContentChecklist />
        </Box>
      )
    case 1:
      return (
        <Box sx={{ m: 4 }}>
          <Typography component="h1" variant="h4" sx={{ my: 2 }}>Step 2: Fill the onboarding form</Typography>
          <NewContentForm onSubmit={(data: any) => console.log(data)} />
        </Box>)
    case 2:
      return (
        <Box sx={{ m: 4 }}>
          <Typography component="h1" variant="h4" sx={{ my: 2 }}>Step 3: Special note for ART</Typography>
          <NewContentNote />
        </Box>)
    case 3:
      return (
        <Box sx={{ m: 4 }}>
          <Typography component="h1" variant="h4" sx={{ my: 2 }}>Step 4: Review your input</Typography>
          <NewContentReview />
        </Box>
      )
    case 4:
      return (
        <Box sx={{ m: 4 }}>
          <Typography component="h1" variant="h4" sx={{ my: 2 }}>Step 5: Done</Typography>
          <NewContentDone />
        </Box>
      )
    default:
      return <></>
  }
}

const steps = [
  'Before you start',
  'Fill the onboarding form',
  'Special note for ART',
  'Review your input',
  'Done'
];

export function NewContentWizard() {
  const { activeStep, handleNext, handleBack } = useNewContentState();
  return (<>
    <Stepper activeStep={activeStep}>
      {steps.map((label, index) => {
        const stepProps: { completed?: boolean } = {};
        const labelProps: {
          optional?: React.ReactNode;
        } = {};
        // if (isStepOptional(index)) {
        //   labelProps.optional = (
        //     <Typography variant="caption">Optional</Typography>
        //   );
        // }
        // if (isStepSkipped(index)) {
        //   stepProps.completed = false;
        // }
        return (
          <Step key={label} {...stepProps}>
            <StepLabel {...labelProps}>{label}</StepLabel>
          </Step>
        );
      })}
    </Stepper>
    <NewContentStep activeStep={activeStep} />
    {/* {activeStep === steps.length ? (
      <React.Fragment>
        <Typography sx={{ mt: 2, mb: 1 }}>
          All steps completed - you&apos;re finished
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleReset}>Reset</Button>
        </Box>
      </React.Fragment>
    ) : (
      <React.Fragment>
        <Box sx={{ mx: 4, pb: 10 }}>
          <div>
            <Button
              variant="contained"
              onClick={handleNext}
              // onClick={methods.handleSubmit(ev=>console.log(ev))}
              sx={{ mt: 1, mr: 1 }}
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Continue'}
            </Button>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mt: 1, mr: 1 }}
            >
              Back
            </Button>
          </div>
        </Box>
      </React.Fragment>)
    } */}
  </>)
}
