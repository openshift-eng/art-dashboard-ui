import React, { createContext, useContext, ReactNode, useMemo, useReducer, useCallback } from "react";

export type Inputs = {
  imageReleaseVersion?: string,
  componentType?: string,
  distgit?: string,
  productManager?: string,
  prodSecReviewJira?: string,
  sourceRepo?: string,
  owners?: string,
  bugComponent?: string,
  specialNote?: string,
  imageType?: string,
  approvalLink?: string,
  imageName?: string,
  deliveryRepo?: string,
  dockerfilePath?: string,
  arches: Set<string>,
  rpmPackageName?: string,
  specfilePath?: string,
  deliveryRepoDescription?: string,
  deliveryRepoDocOwner?: string,
  deliveryRepoErrataWriter?: string,
  deliveryRepoApplicationCategories?: Set<string>,
  deliveryRepoImageUsageType?: string,
  deliveryRepoContentStructure?: string,
  deliveryRepoContentStreams?: string,
  deliveryRepoHostLevelAccess?: string,
  deliveryRepoProductManager?: string,
  deliveryRepoProgramManager?: string,
  deliveryRepoQeOwner?: string,
  deliveryRepoReleaseCategory?: string,
  deliveryRepoSummary?: string,
  deliveryRepoDisplayName?: string,
  deliveryRepoImageType?: string,
  deliveryRepoImageOwner?: string,
  payloadName?: string,
  associatedOperator?: string,
  hasOperatorLabel: boolean,
};

export type NewContentState = {
  activeStep: number,
  inputs: Inputs,
}

export interface NewContentContext extends NewContentState {
  handleNext(): void;
  handleBack(): void;
  handleReset(): void;
  setInputs(inputs: Inputs): void;
}

type Action =
  | { type: "increase" }
  | { type: "decrease" }
  | { type: "reset" }
  | { type: "set-inputs"; inputs: Inputs }

function reducer(state: NewContentState, action: Action): NewContentState {
  // console.log("reducer: %s, %d", action.type, state.activeStep)
  switch (action.type) {
    case "increase":
      // state.activeStep++;
      state = { ...state, activeStep: state.activeStep + 1 }
      return state
    case "decrease":
      // state.activeStep--;
      state = { ...state, activeStep: state.activeStep - 1 }
      return state
    case "reset":
        state = { ...state, activeStep: 0 }
        return state
    case "set-inputs":
      // state.inputs = action.inputs;
      state = { ...state, inputs: action.inputs }
      return state;
    default:
      return state;
  }
}

export const NewContentContext = createContext<NewContentContext | undefined>(undefined);

export function NewContentStateProvider({ children }: { children: ReactNode }) {

  // Set this to true when you want to run through the workflows without entering values manually.
  const debugMode = false

  let initialValues: Inputs

  if (debugMode) {

    // Setting some reasonable defaults to help get through the workflows faster for debugging.
    initialValues = {
      componentType: "image",
      imageType: "other",
      imageName: "openshift/ose-foo-bar",
      deliveryRepo: "openshift4/ose-foo-bar-rhel9",
      dockerfilePath: "/Dockerfile",
      arches: new Set(["all"]),
      hasOperatorLabel: false,
      deliveryRepoApplicationCategories: new Set(["Accounting"]),
      deliveryRepoContentStructure: "singlestream",
      distgit: "foo",
      productManager: "someone",
      sourceRepo: "https://github.com/openshift/foo.git",
      bugComponent: "fake-component",
      owners: "fake-alice@redhat.com, fake-bob@redhat.com",
      rpmPackageName: "openshift-foo",
      specfilePath: "/openshift-foo.spec",
      deliveryRepoDisplayName: "sampleDisplayName",
      deliveryRepoSummary: "sampleSummary",
      deliveryRepoDescription: "sampleDescription",
      deliveryRepoReleaseCategory: "sampleReleaseCategory",
      deliveryRepoHostLevelAccess: "Privileged",
      deliveryRepoImageUsageType: "Component image",
      deliveryRepoImageOwner: "fake-image-owner@redhat.com",
      deliveryRepoProductManager: "Fake Product Manager",
      deliveryRepoProgramManager: "Fake Program Manager",
      deliveryRepoQeOwner: "fake-repo-qe-owner@redhat.com",
      deliveryRepoDocOwner: "fake-repo-doc-owner@redhat.com",
      deliveryRepoErrataWriter: "fake-repo-errata-writer@redhat.com",
      prodSecReviewJira: "PRODSEC-9991"
    }
  } else {
    initialValues = {
      componentType: "image",
      imageType: "other",
      arches: new Set(["all"]),
      hasOperatorLabel: false,
      deliveryRepoApplicationCategories: new Set(),
      deliveryRepoContentStructure: "singlestream",
    }
  }
  const [{ activeStep, inputs }, dispatch] = useReducer(reducer, {
    activeStep: 0,
    inputs: initialValues,
  });
  // Proceed to next step
  const handleNext = useCallback(() => dispatch({ type: "increase" }), []);
  // Go back to prev step
  const handleBack = useCallback(() => dispatch({ type: "decrease" }), []);
  const handleReset = useCallback(() => dispatch({ type: "reset" }), []);
  const setInputs = useCallback((newInputs: Inputs) => dispatch({ type: "set-inputs", inputs: newInputs}), []);
  const contextValue = useMemo(
    () => ({
      activeStep,
      inputs,
      handleNext,
      handleBack,
      handleReset,
      setInputs,
    }),
    [activeStep, inputs, handleNext, handleBack, handleReset, setInputs]
  );
  return (
    <NewContentContext.Provider value={contextValue}>
      {children}
    </NewContentContext.Provider>
  );
}

export function useNewContentState() {
  const context = useContext(NewContentContext);
  if (!context) {
    throw new Error("useNewContentState must be used within the NewContentStateProvider");
  }
  return context;
}
