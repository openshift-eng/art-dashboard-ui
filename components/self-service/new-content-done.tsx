import Box from '@mui/material/Box'
import { Button, Typography } from '@mui/material'
import * as React from 'react';
import { useNewContentState } from './new-content-state'
import YAML from 'yaml'

export default function NewContentDone() {
  const { activeStep, handleBack, handleReset, inputs } = useNewContentState();
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

  return (<Box
    component="div"
    sx={{
      '& > :not(style)': { m: 2},
    }}
  >
    <Box>
      <Typography>Please<Button variant="text" target="_blank" href="https://issues.redhat.com/secure/CreateIssue!default.jspa">create a Jira ticket</Button>for the <strong>ART</strong> project and send it to <strong>@release-artists</strong> on <strong>#forum-ocp-art</strong> on Slack, with the following content:</Typography>
      <Typography component="h6" sx={{ mt: 2 }}><b>Summary</b></Typography>
      <Typography>[BuildAuto] Add OCP component - {distgit_ns}/{distgitName}</Typography>
      <Typography component="h6" sx={{ mt: 2 }}><b>Description</b></Typography>
      <pre>
        {generateYaml()}
      </pre>

      <pre>
        {generateHBYaml()}
      </pre>

    </Box>
    <Box sx={{ py: 2 }}>
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
    </Box>
  </Box>)
}
