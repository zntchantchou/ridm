import { BehaviorSubject, Subject, tap } from "rxjs";
import type {
  ChannelOptions,
  ChannelsState,
  ChannelUpdate,
  Effect,
  EffectState,
  Settings,
  StateUpdates,
  StepperIdType,
  StepperResizeUpdate,
  StepperSelectedStepsUpdate,
  SteppersState,
  TemplateName,
} from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";
import type { StepperOptions } from "../components/Stepper";
import {
  COLORS,
  DEFAULT_STEPPER_BORDER_COLOR,
  DEFAULT_STEPPER_OPTIONS,
  INITIAL_CHANNEL_OPTIONS,
  INITIAL_EFFECTS,
  INITIAL_SETTINGS,
  SAMPLES_DIRS,
} from "./state.constants";
import { generateRandomSteps } from "./state.utils";
import Storage from "./Storage";
import type { PersistedState } from "./storage.types";
import Controls from "../components/Controls";
import templates from "./state.templates";

class State {
  private effects: EffectState;
  private steppers: SteppersState;
  private settings: Settings;
  private channels: ChannelsState;
  // audio updates
  effectUpdateSubject = new Subject<EffectUpdate>();
  tpcUpdateSubject = new Subject<number>();
  volumeUpdateSubject = new Subject<number>();
  // stepper updates
  steppersLoadingSubject = new BehaviorSubject<boolean>(false);
  currentStepperIdSubject = new Subject<StepperIdType>();
  stepperResizeSubject = new Subject<StepperResizeUpdate>();
  stepperSelectedStepsSubject = new Subject<StepperSelectedStepsUpdate>();
  // channel updates
  channelUpdateSubject = new Subject<ChannelUpdate>();

  storage: Storage = new Storage();

  constructor() {
    const { effects, steppers, settings, channels } = this.storage.hasState()
      ? this.deserializeStoreState()
      : this.createInitialState();
    this.effects = effects;
    this.steppers = steppers;
    this.settings = settings;
    this.channels = channels;
    this.storage.initialize({
      effects,
      steppers,
      settings,
      channels,
      subjects: [
        this.currentStepperIdSubject.pipe(
          tap((v) => this.updateSelectedStepperId(v)),
        ),
        this.effectUpdateSubject.pipe(tap((v) => this.updateEffect(v))),
        this.stepperSelectedStepsSubject.pipe(
          tap((v) => this.updateSelectedSteps(v)),
        ),
        this.tpcUpdateSubject.pipe(tap((v) => this.updateTpc(v))),
        this.stepperResizeSubject.pipe(tap((u) => this.updateStepperSize(u))),
        this.volumeUpdateSubject.pipe(tap((v) => this.updateVolume(v))),
        this.channelUpdateSubject.pipe(tap((v) => this.updateChannel(v))),
      ] as Subject<StateUpdates>[],
    });
  }

  // This should only be called if there is no existing state in localStorage
  createInitialState() {
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    const channels = new Map<StepperIdType, ChannelOptions>();
    for (let i = 0; i < 8; i++) {
      const beats = DEFAULT_STEPPER_OPTIONS.beats;
      const stepsPerBeat = DEFAULT_STEPPER_OPTIONS.stepsPerBeat;
      effects.set(i as StepperIdType, INITIAL_EFFECTS);
      steppers.set(i as StepperIdType, {
        beats,
        stepsPerBeat,
        selectedSteps: generateRandomSteps({
          stepsPerBeat: stepsPerBeat,
          beats,
        }),
        color: COLORS[i],
        sampleName: SAMPLES_DIRS[i].name,
        id: i as StepperIdType,
      });
      channels.set(i as StepperIdType, { ...INITIAL_CHANNEL_OPTIONS });
    }
    return { effects, steppers, channels, settings: { ...INITIAL_SETTINGS } };
  }

  deserializeStoreState(): {
    steppers: SteppersState;
    effects: EffectState;
    channels: ChannelsState;
    settings: Settings;
  } {
    const {
      effects: storeEffects,
      steppers: storeSteppers,
      channels: storeChannels,
      settings,
    } = this.storage.getPersistedState() as PersistedState;
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    const channels = new Map<StepperIdType, ChannelOptions>();

    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, storeEffects[i].effects);
      steppers.set(i as StepperIdType, storeSteppers[i]);
      channels.set(i as StepperIdType, storeChannels[i].channelOptions);
    }
    return { effects, steppers, channels, settings };
  }

  deserializeTemplate(name: TemplateName): {
    steppers: SteppersState;
    effects: EffectState;
    channels: ChannelsState;
    settings: Settings;
  } {
    const template = templates[name];
    const templateEffects = template.effects as unknown as {
      effects: Effect[];
    }[];
    const templateSteppers = template.steppers as unknown as StepperOptions[];
    const templateChannels = template.channels as unknown as {
      channelOptions: ChannelOptions;
    }[];

    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    const channels = new Map<StepperIdType, ChannelOptions>();

    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, templateEffects[i].effects);
      steppers.set(i as StepperIdType, templateSteppers[i]);
      channels.set(i as StepperIdType, templateChannels[i].channelOptions);
    }
    return {
      effects,
      steppers,
      channels,
      settings: template.settings as Settings,
    };
  }

  loadTemplate(name: TemplateName) {
    const { effects, steppers, channels, settings } =
      this.deserializeTemplate(name);
    this.effects = effects;
    this.steppers = steppers;
    this.channels = channels;
    this.settings = settings;
  }

  updateEffect = (update: EffectUpdate) => {
    const id = parseInt(update.stepperId) as StepperIdType;
    const existingEffects = this.effects.get(id) as Effect[];
    if (!existingEffects) return;
    const index = existingEffects.findIndex((e) => e.name === update.name);
    if (index < 0) return;
    const updatedValue = { ...existingEffects[index].value, ...update.value };
    const updatedEffects = [...existingEffects];
    updatedEffects[index] = { ...existingEffects[index], value: updatedValue };
    this.effects.set(id, updatedEffects);
  };

  updateSelectedSteps = (update: StepperSelectedStepsUpdate) => {
    const { stepperId, selectedSteps } = update;
    const existingStepper = this.steppers.get(stepperId);
    if (!existingStepper) return;
    const updatedStepper = { ...existingStepper, selectedSteps };
    this.steppers.set(stepperId, updatedStepper);
  };

  updateTpc = (tpc: number) => {
    this.settings.tpc = tpc;
    Controls.tpc = tpc;
  };

  updateVolume = (volume: number) => {
    this.settings.volume = volume;
  };

  updateChannel = (update: ChannelUpdate) => {
    const { stepperId, channelOptions } = update;
    const existingChannel = this.channels.get(stepperId);
    if (!existingChannel) return;
    const updatedChannel = { ...existingChannel, ...channelOptions };
    this.channels.set(stepperId, updatedChannel);
  };

  updateStepperSize = (update: StepperResizeUpdate) => {
    const { stepperId, beats, stepsPerBeat } = update;
    const existingStepper = this.steppers.get(stepperId);
    if (!existingStepper) return;
    const updatedStepper = { ...existingStepper };
    if (beats !== undefined) updatedStepper.beats = beats;
    if (stepsPerBeat !== undefined) updatedStepper.stepsPerBeat = stepsPerBeat;
    this.steppers.set(stepperId, updatedStepper);
  };

  private updateSelectedStepperId(id: StepperIdType) {
    console.log("UPDATE SELECTED STEPPER ID ", id);
    this.settings.selectedStepperId = id;
    const previousStepper = document.querySelector(
      `.stepper-controls[data-selected="on"]`,
    ) as HTMLDivElement;
    if (previousStepper) {
      previousStepper.style.borderColor = DEFAULT_STEPPER_BORDER_COLOR;
      previousStepper.dataset.selected = "off";
    }
    const selectedStepperControls = this.getStepperControls(id);
    const color = this.getStepperOptions(id)?.color.cssColor;
    selectedStepperControls.dataset.selected = "on";
    if (color) {
      selectedStepperControls!.style.borderColor = color;
    }
  }

  getSelectedStepperId() {
    return this.settings.selectedStepperId;
  }

  private getStepperControls(stepperId: number) {
    return document.querySelector(
      `.stepper-controls[data-stepper-id="${stepperId}"]`,
    ) as HTMLDivElement;
  }

  getEffect({
    trackId,
    name,
  }: {
    trackId: StepperIdType;
    name: EffectNameType;
  }) {
    return this.effects.get(trackId)?.find((e) => e.name === name);
  }

  getInitialStepperOptions() {
    return Array.from(this.steppers.values());
  }

  getStepperEffects(stepperId: StepperIdType) {
    return this.effects.get(stepperId);
  }

  getStepperOptions(stepperId: StepperIdType) {
    return this.steppers.get(stepperId);
  }

  getChannelOptions(stepperId: StepperIdType) {
    return this.channels.get(stepperId);
  }

  getSettings() {
    return { ...this.settings };
  }
}

export default new State();
