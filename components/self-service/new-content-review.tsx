import Box from '@mui/material/Box'
import { Button, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material'
import * as React from 'react';
import { useNewContentState } from './new-content-state'

export default function NewContentReview() {
  const { activeStep, handleNext, handleBack, inputs } = useNewContentState();

  return (<Box
    component="div"
    sx={{
      '& > :not(style)': { m: 2, maxWidth: 'sm' },
    }}
  >
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell>Component Type</TableCell>
          <TableCell>{inputs.componentType}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Product Manager</TableCell>
          <TableCell>{inputs.productManager}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Product Security Review Jira</TableCell>
          <TableCell>{inputs.prodSecReviewJira}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Source Repository</TableCell>
          <TableCell>{inputs.sourceRepo}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Owners</TableCell>
          <TableCell>{inputs.owners}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bug Component</TableCell>
          <TableCell>{inputs.bugComponent}</TableCell>
        </TableRow>
      </TableBody>
      {inputs.componentType === "image" ? (
        <TableBody>
          <TableRow>
            <TableCell>Image Type</TableCell>
            <TableCell>{inputs.imageType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Approval Link</TableCell>
            <TableCell>{(inputs.imageType === "cvo-payload" || inputs.imageType === "olm-managed") ? inputs.approvalLink : "(Not Required)"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dockerfile Path</TableCell>
            <TableCell>{inputs.dockerfilePath}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Arches</TableCell>
            <TableCell>{inputs.arches.has('all') ? 'all' : Array.from(inputs.arches).join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Name</TableCell>
            <TableCell>{inputs.deliveryRepo}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Display Name</TableCell>
            <TableCell>{inputs.deliveryRepoDisplayName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Summary</TableCell>
            <TableCell>{inputs.deliveryRepoSummary}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Description</TableCell>
            <TableCell>{inputs.deliveryRepoDescription}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Image Usage Type</TableCell>
            <TableCell>{inputs.deliveryRepoImageType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Name</TableCell>
            <TableCell>{inputs.deliveryRepo}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Release Category</TableCell>
            <TableCell>{inputs.deliveryRepoReleaseCategory}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Host Level Access</TableCell>
            <TableCell>{inputs.deliveryRepoHostLevelAccess}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Application Categories</TableCell>
            <TableCell>{Array.from(inputs.deliveryRepoApplicationCategories).join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Image Usage Type</TableCell>
            <TableCell>{inputs.deliveryRepoImageUsageType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Content Structure</TableCell>
            <TableCell>{inputs.deliveryRepoContentStructure === 'multistream' ? 'Multiple content streams' : 'Single Content stream'}</TableCell>
          </TableRow>
          {inputs.deliveryRepoContentStructure === 'multistream' ? (
              <TableRow>
                <TableCell>Delivery Repository Content Streams</TableCell>
                <TableCell>{inputs.deliveryRepoContentStreams}</TableCell>
              </TableRow>
            ) : (<></>)
          }
          <TableRow>
            <TableCell>Delivery Repository Image Owner</TableCell>
            <TableCell>{inputs.deliveryRepoImageOwner}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Product Manager</TableCell>
            <TableCell>{inputs.deliveryRepoProductManager}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Program Manager</TableCell>
            <TableCell>{inputs.deliveryRepoProgramManager}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository QE Owner</TableCell>
            <TableCell>{inputs.deliveryRepoQeOwner}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Documentation Owner</TableCell>
            <TableCell>{inputs.deliveryRepoDocOwner}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Delivery Repository Errata Writer</TableCell>
            <TableCell>{inputs.deliveryRepoErrataWriter}</TableCell>
          </TableRow>
        </TableBody>
      ) : (
        <TableBody>
          <TableRow>
            <TableCell>RPM Package Name</TableCell>
            <TableCell>{inputs.rpmPackageName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>RPM Spec File Path</TableCell>
            <TableCell>{inputs.specfilePath}</TableCell>
          </TableRow>
        </TableBody>
      )}
      <TableBody>
        <TableRow>
          <TableCell>Special Note for ART</TableCell>
          <TableCell>{inputs.specialNote}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Box sx={{ py: 2 }}>
      <Button
        variant="contained"
        onClick={handleNext}
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
