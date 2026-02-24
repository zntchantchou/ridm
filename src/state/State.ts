import { BehaviorSubject, Subject } from "rxjs";
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
  TrackOptions,
  TracksState,
} from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";
import type { StepperOptions } from "../components/Stepper";
import {
  COLORS,
  DEFAULT_STEPPER_OPTIONS,
  INITIAL_CHANNEL_OPTIONS,
  INITIAL_EFFECTS,
  INITIAL_SETTINGS,
  SAMPLES_DIRS,
} from "./state.constants";
import { generateEmptySteps } from "./state.utils";
import Storage from "./Storage";
import type { PersistedState } from "./storage.types";
import Controls from "../components/Controls";
import templates from "./state.templates";
import Track from "../modules/Track";

class State {
  private effects: EffectState;
  private steppers: SteppersState;
  private settings: Settings;
  private channels: ChannelsState;
  private tracks: TracksState;
  // audio updates
  effectUpdateSubject = new Subject<EffectUpdate>();
  tpcUpdateSubject = new Subject<number>();
  volumeUpdateSubject = new Subject<number>();
  // stepper updates
  steppersLoadingSubject = new BehaviorSubject<boolean>(false);
  currentStepperIdSubject = new Subject<StepperIdType>();
  stepperResizeSubject = new Subject<StepperResizeUpdate>();
  stepperSelectedStepsSubject = new Subject<StepperSelectedStepsUpdate>();
  /** notifies stepper components to rerender */
  templateReloadSubject = new Subject<boolean>();
  // channel updates
  channelUpdateSubject = new Subject<ChannelUpdate>();
  isPlayingSubject = new Subject<boolean>();

  storage: Storage = new Storage();
  isPlaying = false;
  constructor() {
    const { effects, steppers, settings, channels, tracks } =
      this.storage.hasState()
        ? this.deserializeStoreState()
        : this.createInitialState();

    this.effects = effects;
    this.steppers = steppers;
    this.settings = settings;
    this.channels = channels;
    this.tracks = tracks;

    // Subscribe directly to subjects to ensure synchronous state updates
    // BEFORE any Track subscriptions fire
    this.currentStepperIdSubject.subscribe((v) =>
      this.updateSelectedStepperId(v),
    );
    this.effectUpdateSubject.subscribe((v) => this.updateEffect(v));
    this.stepperSelectedStepsSubject.subscribe((v) =>
      this.updateSelectedSteps(v),
    );
    this.tpcUpdateSubject.subscribe((v) => this.updateTpc(v));
    this.stepperResizeSubject.subscribe((u) => this.updateStepperSize(u));
    this.volumeUpdateSubject.subscribe((v) => this.updateVolume(v));
    this.channelUpdateSubject.subscribe((v) => this.updateChannel(v));
    this.isPlayingSubject.subscribe((v) => this.updateIsPlaying(v));

    // Pass raw subjects to Storage for persistence (debounced)
    this.storage.initialize({
      effects,
      steppers,
      settings,
      channels,
      subjects: [
        this.currentStepperIdSubject,
        this.effectUpdateSubject,
        this.stepperSelectedStepsSubject,
        this.tpcUpdateSubject,
        this.stepperResizeSubject,
        this.volumeUpdateSubject,
        this.channelUpdateSubject,
      ] as Subject<StateUpdates>[],
    });
    console.log("STATE CONSTRUCTOR END ", this);
  }

  // This should only be called if there is no existing state in localStorage
  createInitialState() {
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    const channels = new Map<StepperIdType, ChannelOptions>();
    const tracks = new Map<StepperIdType, TrackOptions>();
    for (let i = 0; i < 8; i++) {
      const beats = DEFAULT_STEPPER_OPTIONS.beats;
      const stepsPerBeat = DEFAULT_STEPPER_OPTIONS.stepsPerBeat;
      effects.set(i as StepperIdType, INITIAL_EFFECTS);
      steppers.set(i as StepperIdType, {
        beats,
        stepsPerBeat,
        selectedSteps: generateEmptySteps({
          stepsPerBeat: stepsPerBeat,
          beats,
        }),
        color: COLORS[i],
        sampleName: SAMPLES_DIRS[i].name,
        id: i as StepperIdType,
      });
      channels.set(i as StepperIdType, { ...INITIAL_CHANNEL_OPTIONS });
      tracks.set(i as StepperIdType, {
        stepperId: i as StepperIdType,
        sampleName: SAMPLES_DIRS[i].name,
        instance: new Track({
          stepperId: i.toString(),
          name: SAMPLES_DIRS[i].name,
        }),
      });
    }
    return {
      effects,
      steppers,
      channels,
      settings: { ...INITIAL_SETTINGS },
      tracks,
    };
  }

  deserializeStoreState(): {
    steppers: SteppersState;
    effects: EffectState;
    channels: ChannelsState;
    settings: Settings;
    tracks: TracksState;
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
    const tracks = new Map<StepperIdType, TrackOptions>();
    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, storeEffects[i].effects);
      steppers.set(i as StepperIdType, storeSteppers[i]);
      channels.set(i as StepperIdType, {
        ...storeChannels[i].channelOptions,
        solo: false,
        mute: false,
      });
      tracks.set(i as StepperIdType, {
        stepperId: i as StepperIdType,
        sampleName: SAMPLES_DIRS[i].name,
        instance: new Track({
          stepperId: i.toString(),
          name: SAMPLES_DIRS[i].name,
        }),
      });
    }
    return { effects, steppers, channels, settings, tracks };
  }

  deserializeTemplate(name: TemplateName): {
    steppers: SteppersState;
    effects: EffectState;
    channels: ChannelsState;
    settings: Settings;
  } {
    const template = templates[name];
    // Deep clone to prevent mutation of imported template objects
    const templateCopy = structuredClone(template);
    const templateEffects = templateCopy.effects as unknown as {
      effects: Effect[];
    }[];
    const templateSteppers =
      templateCopy.steppers as unknown as StepperOptions[];
    const templateChannels = templateCopy.channels as unknown as {
      channelOptions: ChannelOptions;
    }[];

    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    const channels = new Map<StepperIdType, ChannelOptions>();

    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, templateEffects[i].effects);
      steppers.set(i as StepperIdType, templateSteppers[i]);
      channels.set(i as StepperIdType, {
        ...templateChannels[i].channelOptions,
        solo: false,
        mute: false,
      });
    }
    return {
      effects,
      steppers,
      channels,
      settings: template.settings as Settings,
    };
  }

  loadTemplate(name: TemplateName) {
    // FOR NOW WE DO NOT WANT TO UPDATE THE TRACKS (when sample change is possible we might)
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
    this.settings.selectedStepperId = id;
  }

  updateIsPlaying(value: boolean) {
    this.isPlaying = value;
  }

  getSelectedStepperId() {
    return this.settings.selectedStepperId;
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

  getChannels() {
    return Array.from(this.channels.values());
  }

  getChannelsAsObjects() {
    const channels = [];
    for (const [index, items] of this.channels.entries()) {
      channels.push({ stepperId: index, values: items });
    }
    return channels;
  }

  getTrack(stepperId: StepperIdType) {
    return this.tracks.get(stepperId);
  }

  getTracks() {
    return Array.from(this.tracks.values());
  }

  getSelectedStepperOptions() {
    return this.steppers.get(this.getSelectedStepperId());
  }
}

export default new State();
