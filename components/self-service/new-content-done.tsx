import Box from '@mui/material/Box'
import { Button, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { useNewContentState } from './new-content-state'
import { message }  from 'antd';
import YAML from 'yaml'
import { makeApiCall } from '../api_calls/api_calls';

export default function NewContentDone() {
  const { activeStep, handleBack, handleReset, inputs } = useNewContentState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const distgit_ns = inputs.componentType == 'rpm' ? 'rpms' : 'containers';
  let web_url = inputs.sourceRepo;
  if (web_url?.endsWith('.git'))
    web_url = web_url.substring(0, web_url.length - 4);
  const repo_url = 'git@github.com:openshift-priv/' + web_url?.substring(web_url.lastIndexOf('/')+ 1) + '.git';
  const owners = inputs.owners?.split(',').map(s => s.trim());

  let distgitName = inputs.deliveryRepo?.replace(/^openshift\d+\//, "");
  // Remove 'ose' from the start of the string
  distgitName = distgitName.replace(/^ose-/, '');

  // Remove 'rhel' followed by a number at the end of the string
  distgitName = distgitName.replace(/-rhel\d+$/, '');

  const generateImageConfig = () => {
    const imageName = inputs.deliveryRepo?.replace(/^openshift\d+\//, "openshift/");
    return {
      mode: 'wip',
      name: imageName,
      delivery_repo: inputs.deliveryRepo,
      for_payload: inputs.imageType === "cvo-payload" || inputs.hasOperatorLabel,
      content: {
        source: {
          git: {
            web: web_url,
            url: repo_url,
            branch: {
              target: 'release-{MAJOR}.{MINOR}',
            },
          },
          dockerfile: inputs.dockerfilePath,
        }
      },
      owners: owners,
      arches: !inputs.arches.has('all') ? Array.from(inputs.arches) : undefined,
    }
  };

  const generateRpmConfig = () => {
    return {
      mode: 'wip',
      name: inputs.rpmPackageName,
      content: {
        source: {
          git: {
            web: web_url,
            url: repo_url,
            branch: {
              target: 'release-{MAJOR}.{MINOR}',
            },
          },
          specfile: inputs.specfilePath,
        }
      },
      owners: owners,
    }
  };

  const generateHBYaml = () => {
    const result: Record<string, any> = {
      honey_badger_meta: {
        "display-name": inputs.deliveryRepoDisplayName,
        image_type: inputs.deliveryRepoImageType,
        owner: inputs.deliveryRepoImageOwner,
        delivery_repo_name: inputs.deliveryRepo,
        description: inputs.deliveryRepoDescription,
        doc_owner: inputs.deliveryRepoDocOwner,
        errata_writer: inputs.deliveryRepoErrataWriter !== undefined ? inputs.deliveryRepoErrataWriter : inputs.deliveryRepoDocOwner,
        host_level_access: inputs.deliveryRepoHostLevelAccess,
        product_manager: inputs.deliveryRepoProductManager,
        program_manager: inputs.deliveryRepoProgramManager,
        qe_owner: inputs.deliveryRepoQeOwner,
        release_category: inputs.deliveryRepoReleaseCategory,
        summary: inputs.deliveryRepoSummary,
        application_categories: inputs.deliveryRepoApplicationCategories,
        usage_type: inputs.deliveryRepoImageUsageType,
        multistream: inputs.deliveryRepoContentStructure === 'multistream',
        content_stream_tags: inputs.deliveryRepoContentStructure == 'multistream' ? inputs.deliveryRepoContentStreams.split(',').map((version) => 'v' + version.trim()) : ['latest'],
        use_latest: inputs.deliveryRepoContentStructure !== 'multistream',
        vendor_label: 'redhat',
      }
    };
    return YAML.stringify(result);
  };


  const generateYaml = () => {
    const result: Record<string, any> = {
      meta: {
        release: inputs.imageReleaseVersion,
        payload_name: inputs.payloadName,
        component_type: inputs.componentType,
        distgit_repo: `${distgit_ns}/${distgitName}`,
        product_manager: inputs.productManager,
        prodsec_review_jira: inputs.prodSecReviewJira,
        bug_component: inputs.bugComponent,
        special_node: inputs.specialNote,
        image_type: inputs.componentType === 'image' ? inputs.imageType : undefined,
        approval_link: inputs.approvalLink,
        config_file: `${inputs.componentType}s/${inputs.distgit}.yml`,
        associated_operator: inputs.associatedOperator
      },
      config_snippet: inputs.componentType === 'image' ? generateImageConfig() : generateRpmConfig(),
    };
    return YAML.stringify(result);
  };

  const jiraSummary = `[BuildAuto] Add OCP component - ${distgit_ns}/${distgitName}`

  const handleSubmitRequest = async () => {

    // Use this to remove the button immediately to avoid the user being able to
    // click while a request is being processed.
    setIsSubmitted(true);

    const imageName = web_url?.substring(web_url.lastIndexOf('/')+ 1)
    const jiraDescription = `${generateYaml()}\n\n${generateHBYaml()}`;
    const ARTProjectID = "ART"
    const ARTStoryTypeID = "Story"
    const component = "Release work";
    const priority = "Normal";

    const fileContent = `content:
  source:
    dockerfile: ${inputs.dockerfilePath}
    git:
      branch:
        target: release-{MAJOR}.{MINOR}
      url: ${repo_url}
      web: ${web_url}
    ci_alignment:
      streams_prs:
        ci_build_root:
          stream: rhel-9-golang-ci-build-root
distgit:
  branch: rhaos-{MAJOR}.{MINOR}-rhel-9
  component: ${imageName}-container
enabled_repos: []
for_payload: ${inputs.imageType === "cvo-payload" || inputs.hasOperatorLabel}
from:
  builder:
  - stream: rhel-9-golang
  member: openshift-enterprise-base-rhel9
name: openshift/${imageName}-rhel9
owners:
- ${inputs.deliveryRepoImageOwner}@redhat.com
`;

    const params = {
      image_name: imageName,
      release_for_image: inputs.imageReleaseVersion,
      file_content: fileContent,
      jira_summary: jiraSummary,
      jira_description: jiraDescription,
      jira_project_id: ARTProjectID,
      jira_story_type_id: ARTStoryTypeID,
      jira_component: component,
      jira_priority: priority,
      image_type: inputs.imageType,
      payload_name: inputs.payloadName,

      // the default mode is test mode (i.e., create fake PR and Jira) so you can easily
      // test the UI and API and be intentional about actually creating the PR and Jira.
      git_test_mode: "false",
      jira_test_mode: "false"
    }

    try {
      message.loading({
        content: 'Creating PR and Jira ...',
        duration: 0
      });
      const response = await makeApiCall('/api/v1/git_jira_api', 'GET', {}, {}, params, false);
      setDialogTitle('Error occurred');
      if (response?.status === "success") {
        // Override the dialog title and content to show Jira and PR URLs.
        setDialogTitle('Jira and PR created successfully:');
        setDialogContent([response.jira_url, response.pr_url]);
      } else {
        setDialogContent([`ART UI server return status: ${response?.status}`,
                          `Error message: ${response?.error}`,
                          `Other error: ${response?.detail}`,
                          `Other message: ${response?.message}`]);
        // If the call to ART UI server failed, we should allow the user to try again.
        setIsSubmitted(false);
      }
      setDialogOpen(true);
    } catch (error) {
      setDialogContent(['Error in call to ART UI server', `ART UI server error: ${error}`]);
      setDialogOpen(true);

      // If the call to ART UI server failed, we should allow the user to try again.
      setIsSubmitted(false);
    } finally {

      // Ensure we get rid of the loading message whether the and Jira and PR creation succeeded or not.
      message.destroy();
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (<Box
    component="div"
    sx={{
      '& > :not(style)': { m: 2 },
    }}
  >
    <Box>
      <Typography sx={{ mb: 3 }}>About to make a Jira in the <strong>ART</strong> project using the <strong>Summary</strong> and <strong>Description</strong> below:</Typography>
      <hr />
      <Typography component="h6" sx={{ mt: 2 }}><b>Summary</b></Typography>
      <Typography>{jiraSummary}</Typography>
      <Typography component="h6" sx={{ mt: 2 }}><b>Description</b></Typography>
      <pre>
        {generateYaml()}
      </pre>

      <pre>
        {generateHBYaml()}
      </pre>
      <hr />
      <Typography sx={{ mt: 3 }}>
        Follow these steps:
      </Typography>
      <ul>
        <li>If the above looks good, click the Submit Request button and a Jira and PR will be created</li>
        <li>Inform <strong>@release-artists</strong> on <strong>#forum-ocp-art</strong> on Slack about the Jira and PR</li>
      </ul>
    </Box>
    <Box sx={{ py: 2 }}>
      {!isSubmitted && (
        <Button
          variant="contained"
          onClick={handleSubmitRequest}
          sx={{ mt: 1, mr: 1 }}
        >
          Submit Request
        </Button>
      )}
      <Button
        variant="contained"
        onClick={handleReset}
        sx={{ mt: 1, mr: 1 }}
      >
        Start another
      </Button>
      <Button
        disabled={activeStep === 0}
        onClick={handleBack}
        sx={{ mt: 1, mr: 1 }}
      >
        Back
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogContent.map((text, index) => {
              return (
                <span key={index}>
                  {text.startsWith('https://') ? (
                    <a href={text} target="_blank" rel="noopener noreferrer">
                      {text}
                    </a>
                  ) : (
                    text
                  )}
                  <br />
                </span>
              );
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={handleCloseDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  </Box>)
}
