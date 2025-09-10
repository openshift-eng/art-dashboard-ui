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
      <FormControlLabel control={<Checkbox {...register("check_dptp_ci", {required: true})} />}
                        label="I have onboarded the image/rpm with DPTP/CI"/>
      <Tooltip
          title="ART manages production builds. Before an image is ready to build and ship, it will need CI managed by prow, which is a completely separate process/system and the province of the DPTP team. Click the help icon for more information.">
        <IconButton color="primary" aria-label="help"
                    href="https://docs.ci.openshift.org/docs/how-tos/onboarding-a-new-component/" target="_blank">
          <HelpIcon/>
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_operator_hub", {required: true})} />}
                        label="Is this an Operator destined for Operator Hub? Talk to ART before proceeding."/>
      <Tooltip title={`OperatorHub, aka Marketplace, App Registry, and various other names - you are shipping your operator
                  through the marketplace/OperatorHub if it is not one of the operators deployed by the CVO (cluster version operator) but instead by OLM. Reach out to @release-artists on #forum-ocp-art`}>
        <IconButton color="primary" aria-label="help" href={configData.cpaas_doc_help_link} target="_blank">
          <HelpIcon/>
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_prodsec_review", {required: true})} />}
                        label="You have performed a threat model assessment"/>
      <Tooltip title={`ProdSec no longer performs an assessment, instead requiring a self-assessment from this link`}>
        <IconButton color="primary" aria-label="help"
                    href="https://spaces.redhat.com/spaces/PRODSEC/pages/388107958/Request+an+SD+Elements+Threat+Model+for+new+OCP+components"
                    target="_blank">
          <HelpIcon/>
        </IconButton>
      </Tooltip>
    </Box>
    <Box>
      <FormControlLabel control={<Checkbox {...register("check_alignment", {required: true})} />}
                        label="My image/rpm has aligned with Product Management / Docs / QE / Product Support"/>
      <Tooltip title={`While not a technical requirement for building a new component, please ensure that there is a shared understanding
                  among these key stakeholders concerning the production release of your component.`}>
        <IconButton color="primary" aria-label="help"
                    href="https://source.redhat.com/groups/public/atomicopenshift/atomicopenshift_wiki/guidelines_for_requesting_new_content_managed_by_ocp_art#product-management-docs-qe-product-support-alignment"
                    target="_blank">
          <HelpIcon/>
        </IconButton>
      </Tooltip>
    </Box>
    <br/><br/>
    <Typography variant="caption" sx={{py: 5}}> (This questionnaire will result in the creation of a ticket in
      the &nbsp;
      <a href="https://issues.redhat.com/browse/ART">ART JIRA project</a> where final details of the image addition can
      be
      discussed before being finalized. Submitters do not need to create repositories themselves in &nbsp;
      <a href="https://comet.engineering.redhat.com/">Comet</a>. ART
      will create these repositories as part of our <a
          href="https://art-docs.engineering.redhat.com/sop/image_add/">SOP</a>)
    </Typography>
    <Box sx={{py: 2}}>
      <Button
          variant="contained"
          onClick={handleSubmit(onSubmitHandler, onErrorHandler)}
          sx={{mt: 1, mr: 1}}
          disabled={!isValid}
      >
        Continue
      </Button>
      <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{mt: 1, mr: 1}}
      >
        Back
      </Button>
    </Box>
  </form>)
}
