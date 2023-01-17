import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from '@mui/material'
import * as React from 'react';
import { Inputs, useNewContentState } from './new-content-state'

export default function NewContentNote({ onSubmit }: { onSubmit?: SubmitHandler<Inputs>}) {
  const {activeStep, handleNext, handleBack, inputs, setInputs} = useNewContentState();
  const { control, register, handleSubmit, watch, getValues, setValue, formState: { errors } } = useForm<Inputs>({
    mode: 'onChange',
    defaultValues: inputs,
  });
  const onSubmitHandler: SubmitHandler<Inputs> = data => {
    setInputs(data);
    if (onSubmit) {
      onSubmit(data);
    }
    handleNext();
  };

  return (<Box
    component="form"
    sx={{
      '& > :not(style)': { m: 2, maxWidth: 'sm' },
    }}
  >
    <Box>
      <TextField fullWidth label="Special note" variant="outlined" minRows="5"
        {...register("specialNote", {max: 256})}
        error={errors.specialNote !== undefined}
        helperText="Are there any other dates or considerations ART and CD should be aware of?"
        multiline
        />
    </Box>
    <Box sx={{ py: 2 }}>
      <Button
        variant="contained"
        onClick={handleSubmit(onSubmitHandler)}
        sx={{ mt: 1, mr: 1 }}
      >
        Continue
      </Button>
      <Button
        disabled={activeStep === 0}
        onClick={handleBack}
        sx={{ mt: 1, mr: 1 }}
      >
        Back
      </Button>
    </Box>
  </Box>)
}
