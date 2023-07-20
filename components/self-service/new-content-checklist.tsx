import Box from "@mui/material/Box";
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/Help';
import { Button, Typography } from "@mui/material";
import { useNewContentState } from "./new-content-state";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import frontendConfig from "../../frontend.config.json"

export function NewContentChecklist() {
  const { activeStep, handleNext, handleBack } = useNewContentState();
  const { control, register, handleSubmit, watch, getValues, setValue, formState: { isValid, errors } } = useForm<any>({
    mode: 'onChange',
    defaultValues: {},
  });
  const onSubmitHandler: SubmitHandler<any> = data => {
    handleNext();
  }
  const onErrorHandler: SubmitErrorHandler<any> = (err) => {
    console.log(err);
  };
  const configData = frontendConfig.newContent.checklist;
  return (<form>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_dptp_ci", { required: true })} />} label="I have onboarded the image/rpm with DPTP/CI" />
      <Tooltip title="ART manages production builds. Before an image is ready to build and ship, it will need CI managed by prow, which is a completely separate process/system and the province of the DPTP team. Click the help icon for more information.">
        <IconButton color="primary" aria-label="help" href="https://docs.ci.openshift.org/docs/how-tos/onboarding-a-new-component/" target="_blank">
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_operator_hub", { required: true })} />} label="If this is an image, it is not an operator destined for OperatorHub" />
      <Tooltip title={`OperatorHub, aka Marketplace, App Registry, and various other names - you are shipping your operator
                  through the marketplace/OperatorHub if it is not one of the operators deployed by the CVO (cluster version operator) but instead by OLM.
                  Click the help icon for more information.`}>
        <IconButton color="primary" aria-label="help" href={configData.cpaas_doc_help_link} target="_blank">
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_distgit", { required: true })} />} label="I have requested a dist-git repository and delivery repository in Comet for my image/rpm" />
      <Tooltip title={`Before ART can build your image or RPM it must be populated in dist-git and (for image) added to the delivery repos managed by EXD SP.
                  Click the help icon for more information.`}>
        <IconButton color="primary" aria-label="help" href="https://source.redhat.com/groups/public/atomicopenshift/atomicopenshift_wiki/requesting_a_new_image_or_rpm_to_be_managed_by_art" target="_blank">
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_prodsec_review", { required: true })} />} label="You have performed a threat model assessment" />
      <Tooltip title={`ProdSec no longer performs an assessment, instead requiring a self-assessment from this link`}>
        <IconButton color="primary" aria-label="help" href="https://docs.engineering.redhat.com/display/PRODSEC/Request+a+SD+Elements+Threat+Model+for+new+OCP+components" target="_blank">
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_alignment", { required: true })} />} label="My image/rpm has aligned with Product Management / Docs / QE / Product Support" />
      <Tooltip title={`While not a technical requirement for building a new component, please ensure that there is a shared understanding
                  among these key stakeholders concerning the production release of your component.`}>
        <IconButton color="primary" aria-label="help" href="https://source.redhat.com/groups/public/atomicopenshift/atomicopenshift_wiki/guidelines_for_requesting_new_content_managed_by_ocp_art#product-management-docs-qe-product-support-alignment" target="_blank">
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Typography sx={{ py: 2 }}>Click on [?] icons to open the relevant docs.</Typography>
    <Box sx={{ py: 2 }}>
      <Button
        variant="contained"
        onClick={handleSubmit(onSubmitHandler, onErrorHandler)}
        sx={{ mt: 1, mr: 1 }}
        disabled={!isValid}
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
  </form>)
}
