import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import RadioGroup from '@mui/material/RadioGroup'
import FormLabel from '@mui/material/FormLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Button, Checkbox, FormGroup, IconButton, Tooltip, Typography } from '@mui/material'
import * as React from 'react';
import { Inputs, useNewContentState } from './new-content-state'
import HelpIcon from '@mui/icons-material/Help';
import frontendConfig from "../../frontend.config.json"

export default function NewContentForm({ onSubmit, defaultValues }: { onSubmit?: SubmitHandler<Inputs>, defaultValues?: Inputs }) {
  const { activeStep, handleNext, handleBack, inputs, setInputs } = useNewContentState();
  const { control, register, handleSubmit, watch, getValues, setValue, formState: { errors } } = useForm<Inputs>({
    mode: 'onChange',
    defaultValues: inputs,
  });
  const onSubmitHandler: SubmitHandler<Inputs> = data => {
    console.log("data=", data);
    setInputs(data);
    if (onSubmit) {
      onSubmit(data)
    }
    handleNext();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let current = getValues().arches;
    let arch = event.target.name.toLowerCase()
    if (event.target.checked) {
      current.add(arch)
    } else {
      current.delete(arch)
      if (arch === "all") {
        current.add("x86_64")
        current.add("ppc64le")
        current.add("s390x")
        current.add("aarch64")
      }
    }
    setValue("arches", current)
  };

  const values = watch();

  const configData = frontendConfig.form;

  return (<Box
    component="form"
    sx={{
      '& > :not(style)': { mx: 2, my: 3, maxWidth: 'sm' },
    }}
  >
    <Typography component="h1" variant="h5" sx={{ my: 2 }}>General</Typography>
    <Box>
      <FormControl>
        <FormLabel id="component-type-group-label">Component Type</FormLabel>
        <Controller
          control={control}
          name="componentType"
          rules={{ required: true }}
          render={({ field }) => (
            <RadioGroup
              row
              aria-labelledby="component-type-group-label"
              defaultValue="image"
              {...field}
            >
              <FormControlLabel control={<Radio value="image" />} label="Image" />
              <FormControlLabel control={<Radio value="rpm" />} label="RPM" />
            </RadioGroup>
          )}
        />
      </FormControl>
    </Box>
    <Box>
      <TextField fullWidth label="Product Manager" variant="outlined"
        required
        {...register("productManager", { required: true })}
        error={errors.productManager !== undefined}
        helperText="Who is the product manager that approved adding this image to the OCP product?" />
    </Box>
    <Box>
      <TextField fullWidth label="ProdSec Review Jira" variant="outlined"
        {...register("prodSecReviewJira")}
        error={errors.prodSecReviewJira !== undefined}
        helperText="Reach out to the ProdSec OpenShift SME (currently Hardik Vyas <hvyas@redhat.com>) to determine what audit/review process is necessary. What is the ProdSec review Jira you filed?" />
    </Box>
    <Box>
      <TextField fullWidth label="Source GitHub Repository" variant="outlined"
        required
        {...register("sourceRepo", { required: true, pattern: /^https:\/\/github\.com\/openshift\/[\w-]+(\.git)?$|^git@github\.com:openshift\/[\w-]+\.git$/ })}
        error={errors.sourceRepo !== undefined}
        helperText="What is the source GitHub repo to be built from? e.g. https://github.com/openshift/foo.git" />
    </Box>
    <Box>
      <TextField fullWidth label="Bug Component" variant="outlined"
        required
        {...register("bugComponent", { required: true, pattern: /^[\w-\/\s]+$/ })}
        error={errors.bugComponent !== undefined}
        helperText="What is the Jira or Bugzilla component of your OpenShift component?" />
    </Box>
    <Box>
      <TextField fullWidth label="Email Addresses of the Owners" variant="outlined"
        required
        {...register("owners", { required: true, pattern: /^[\w.+-]+@redhat\.com(,\s*[\w.+-]+@redhat\.com)*$/ })}
        error={errors.owners !== undefined}
        helperText="What are the email addresses (mailing lists are preferred!) of the owners? Who should be notified of events relevant to the builds (e.g. if they cannot be built)? Addresses must end with @redhat.com. You can use comma to separate multiple addresses." />
    </Box>
    {values.componentType === 'image' ? (<>
      {/* Image-specific fields */}
      <FormControl>
        <FormLabel id="image-type-group-label">Image Type</FormLabel>
        <Controller
          control={control}
          name="imageType"
          rules={{ required: true }}
          render={({ field }) => (
            <RadioGroup
              aria-labelledby="image-type-group-label"
              defaultValue="other"
              {...field}
            >
              <FormControlLabel control={<Radio value="cvo-payload" />} label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>Release payload content (Staff engineering team approval required)</Typography>
                  <Tooltip title={configData.cvo_payload_help}>
                    <HelpIcon color='primary' sx={{ mx: 1 }} />
                  </Tooltip>
                </Box>
              } />
              <FormControlLabel control={<Radio value="olm-managed" />} label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>Operator managed by OLM (Product Management approval required)</Typography>
                  <Tooltip title="Be aware that OLM Operator additions should routinely go through CPaaS, and need special approval from Product Management to have ART manage them in OCP Core instead.">
                    <HelpIcon color='primary' sx={{ mx: 1 }} />
                  </Tooltip>
                </Box>
              } />
              <FormControlLabel control={<Radio value="operand" />} label="Operand for an OLM-managed operator" />
              <FormControlLabel control={<Radio value="other" />} label="Other non-payload container image (extras)" />
            </RadioGroup>
          )}
        />
      </FormControl>
      {
        values.imageType === "operand" ? (
            <Box>
              <Controller
                  control={control}
                  name="associatedOperator"
                  rules={{ required: true }}
                  render={({ field }) => (
                      <TextField label="Associated Operator" variant="outlined" fullWidth
                                 required
                                 {...field}
                                 error={errors.associatedOperator !== undefined}
                                 helperText={"Which operator is this operand associated to?"} />
                  )}
              />
            </Box>
        ) : (<></>)
      }
      {
        values.imageType === "cvo-payload" ? (
            <Box>
              <Controller
                  control={control}
                  name="payloadName"
                  rules={{ required: true }}
                  render={({ field }) => (
                      <TextField label="Payload Name" variant="outlined" fullWidth
                                 required
                                 {...field}
                                 error={errors.payloadName !== undefined}
                                 helperText={"Name of the release payload"} />
                  )}
              />
            </Box>
        ) : (<></>)
      }
      {
        values.imageType === "cvo-payload" || values.imageType === "olm-managed" ? (
          <Box>
            <Controller
                control={control}
                name="approvalLink"
                rules={{ required: true }}
                render={({ field }) => (
                    <TextField label="Staff Engineer Approval" variant="outlined" fullWidth
                               required
                               {...field}
                               error={errors.approvalLink !== undefined}
                               helperText={"Link to staff engineer approval"} />
                )}
            />
          </Box>
        ) : (<></>)
      }
      <Box>
        <TextField label="Dockerfile Path" variant="outlined" fullWidth
          required
          {...register("dockerfilePath", { required: true })}
          error={errors.dockerfilePath !== undefined}
          helperText="Where in your repo is the Dockerfile ART should use for this image? e.g. /images/foo/Dockerfile or /Dockerfile.ocp" />
      </Box>
      <FormControl sx={{ m: 2 }} component="fieldset" variant="standard">
        <FormLabel component="legend">Architectures</FormLabel>
        <FormGroup>
          <FormControlLabel control={<Checkbox name='all' checked={values.arches.has('all')} onChange={handleChange} />} label="All (follows future architectures)" />
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
            <FormControlLabel control={<Checkbox name='x86_64' checked={values.arches.has('x86_64') || values.arches.has('all')} disabled={values.arches.has('all')} onChange={handleChange} />} label="x86_64 (amd64)" />
            <FormControlLabel control={<Checkbox name='s390x' checked={values.arches.has('s390x') || values.arches.has('all')} disabled={values.arches.has('all')} onChange={handleChange} />} label="s390x" />
            <FormControlLabel control={<Checkbox name='ppc64le' checked={values.arches.has('ppc64le') || values.arches.has('all')} disabled={values.arches.has('all')} onChange={handleChange} />} label="ppc64le" />
            <FormControlLabel control={<Checkbox name='aarch64' checked={values.arches.has('aarch64') || values.arches.has('all')} disabled={values.arches.has('all')} onChange={handleChange} />} label="aarch64 (arm64)" />
          </Box>
        </FormGroup>
      </FormControl>


      <Typography component="h1" variant="h5" sx={{ my: 2 }}>Delivery (Comet) Repository details</Typography>

      <Box>
        <TextField label="Repository Name" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepo", { required: true, pattern: /^openshift\d+\/[\w-]+$/ })}
                   error={errors.deliveryRepo !== undefined}
                   helperText="What is the proposed comet delivery repo name for this image (e.g. openshift4/foo-bar-rhel9)?" />
      </Box>


      <Typography component="h1" variant="h6" sx={{ my: 2 }}>Display Data</Typography>

      <Box>
        <TextField label="Display Name" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoDisplayName", { required: true })}
                   error={errors.deliveryRepoDisplayName !== undefined}
                   helperText="Human-readable name for the repository" />
      </Box>
      <Box>
        <TextField label="Summary" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoSummary", { required: true })}
                   error={errors.deliveryRepoSummary !== undefined}
                   helperText="A brief description used for search results" />
      </Box>
      <Box>
        <TextField label="Repository Description" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoDescription", { required: true})}
                   error={errors.deliveryRepoDescription !== undefined}
                   helperText="A brief description used for search results, on the Comet page https://comet.engineering.redhat.com/" />
      </Box>
      <Box>
        <TextField label="Release Category" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoReleaseCategory", { required: true})}
                   error={errors.deliveryRepoReleaseCategory !== undefined}
                   helperText="GA or Tech-Preview. Release category indicates the support level for an image, determines the signing key used when publishing to a registry, and is often indicated in the repository path. More information here (https://source.redhat.com/groups/public/release-engineering/release_engineering_rcm_wiki/product_dimensions_for_release_engineering)" />
      </Box>
      <Box>
        <TextField label="Host Level Access" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoHostLevelAccess", { required: true})}
                   error={errors.deliveryRepoHostLevelAccess !== undefined}
                   helperText="'Unprivileged' is isolated from the host. 'Privileged' runs as root on the host." />
      </Box>

      <Typography component="h1" variant="h6" sx={{ my: 2 }}>Ownership</Typography>

      <Box>
        <TextField label="Image Owner" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoImageOwner", { required: true})}
                   error={errors.deliveryRepoImageOwner !== undefined}
                   helperText="Email(s) of developer(s) responsible for image builds in this repository. Can be comma separated." />
      </Box>
      <Box>
        <TextField label="Product Manager" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoProductManager", { required: true})}
                   error={errors.deliveryRepoProductManager !== undefined}
                   helperText="Email(s) of primary stakeholder(s) for this repository. Can be comma separated." />
      </Box>
      <Box>
        <TextField label="Program Manager" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoProgramManager", { required: true})}
                   error={errors.deliveryRepoProgramManager !== undefined}
                   helperText="Email(s) of manager(s) responsible for coordination of this repository’s product team. Can be comma separated." />
      </Box>
      <Box>
        <TextField label="QE Owner" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoQeOwner", { required: true})}
                   error={errors.deliveryRepoQeOwner !== undefined}
                   helperText="Email(s) of engineer(s) responsible for testing image builds in this repository. Can be comma separated." />
      </Box>
      <Box>
        <TextField label="Documentation Owner" variant="outlined" fullWidth
                   required
                   {...register("deliveryRepoDocOwner", { required: true})}
                   error={errors.deliveryRepoDocOwner !== undefined}
                   helperText="Email(s) of Customer Content Services contact(s) responsible for providing documentation for this repository. Can be comma separated." />
      </Box>
      <Box>
        <TextField label="Errata Writer" variant="outlined" fullWidth
                   {...register("deliveryRepoErrataWriter", { required: true})}
                   helperText="[OPTIONAL] If different from Documentation Writer. Email(s) of Customer Content Services contact(s) responsible for writing Errata text for this repository. Can be comma separated." />
      </Box>

    </>) : (<>
      {/* RPM-specific fields */}
      <Box>
        <Controller
            control={control}
            name="approvalLink"
            rules={{ required: true }}
            render={({ field }) => (
                <TextField label="Staff Engineer Approval" variant="outlined" fullWidth
                           required
                           {...field}
                           error={errors.approvalLink !== undefined}
                           helperText={"Link to staff engineer approval"} />
            )}
        />
      </Box>
      <Box>
        <TextField label="RPM Package Name" variant="outlined" fullWidth
          required
          {...register("rpmPackageName", { required: true, pattern: /^[\w-]+$/ })}
          error={errors.rpmPackageName !== undefined}
          helperText="What is the rpm package name (e.g. openshift-foo)?" />
      </Box>
      <Box>
        <TextField label="Spec File Path" variant="outlined" fullWidth
          required
          {...register("specfilePath", { required: true })}
          error={errors.specfilePath !== undefined}
          helperText="Where in your repo is the spec file ART should use for this rpm? e.g. /openshift-foo.spec" />
      </Box>
    </>)}
    <Box sx={{ py: 2 }}>
      <Button
        variant="contained"
        onClick={handleSubmit(onSubmitHandler, err => console.log("err=", inputs))}
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
