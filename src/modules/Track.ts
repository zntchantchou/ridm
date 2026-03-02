import * as Tone from "tone";
import Audio from "./Audio.ts";
import { debounceTime, filter, tap, type Subscription } from "rxjs";
import Controls from "./Controls.ts";
import type {
  EffectNameType,
  EffectUpdate,
  PitchOptions,
  TrackEffect,
} from "../types.ts";
import State from "../state/State.ts";
import type { ChannelUpdate, StepperIdType } from "../state/state.types.ts";
import type Pulse from "./Pulse.ts";
import Pulses from "./Pulses.ts";
import { DEBOUNCE_TIME_MS } from "../state/state.constants.ts";
import SampleRegistry from "./SampleRegistry.ts";

const DEFAULT_SAMPLE_RATE = 1;
const MIN_SAMPLE_RATE = 0.25;
const MAX_SAMPLE_RATE = 3;

type TrackOptions = {
  sampleId: string;
  stepperId: string;
  source?: Tone.Player;
  effects?: TrackEffect[];
  sampleRate?: number;
};

class Track {
  sampleId: string;
  samplePath?: string;
  sampleRate: number = 0;
  stepperId: string;
  source?: Tone.Player;
  effects: TrackEffect[] = [];
  effectUpdateSubscription?: Subscription;
  channelUpdateSubscription?: Subscription;
  channel?: Tone.Channel; // handles volume, pan, mute, solo
  effectUpdateMethodsMap: Map<EffectNameType, (update: EffectUpdate) => void> =
    new Map();
  pulseSubscription: Subscription | null = null;
  resizeSubscription: Subscription | null = null;

  constructor({ sampleId, stepperId, sampleRate }: TrackOptions) {
    this.sampleId = sampleId;
    this.stepperId = stepperId;
    if (!this.sampleId) throw new Error("NO SAMPLE ID PROVIDED AT TRACK INIT");
    if (!Number.isNaN(sampleRate) && sampleRate) {
      this.sampleRate = sampleRate;
    }
  }

  async init() {
    Tone.setContext(Audio.ctx as Tone.Context);
    await this.loadInitialSample();
    this.loadEffects();
    this.initializeUpdateMethods();
    const channelOptions = State.getChannelOptions(
      parseInt(this.stepperId) as StepperIdType,
    );
    this.channel?.set({ ...channelOptions });
    this.effectUpdateSubscription = State.effectUpdateSubject
      .pipe(
        filter((update: EffectUpdate) => update.stepperId === this.stepperId),
      )
      .subscribe(this.handleEffectUpdate);
    this.channelUpdateSubscription = State.channelUpdateSubject
      .pipe(
        filter(
          (update: ChannelUpdate) =>
            update.stepperId === parseInt(this.stepperId),
        ),
      )
      .subscribe(this.handleChannelUpdate);
    this.listenToResize();
  }

  dispose() {
    this.effectUpdateSubscription?.unsubscribe();
    this.channelUpdateSubscription?.unsubscribe();

    this.source?.dispose();
    this.channel?.dispose();
    this.effects?.forEach((effect) => {
      effect.node?.dispose();
    });

    this.effectUpdateSubscription = undefined;
    this.channelUpdateSubscription = undefined;
    this.source = undefined;
    this.channel = undefined;
    this.effects = [];
  }

  private async loadInitialSample() {
    try {
      const fullPath = SampleRegistry.resolvePath(this.sampleId);
      this.source = new Tone.Player();
      await this.source.load(fullPath as string);
      const storedPitch = State.getEffect({
        trackId: parseInt(this.stepperId) as StepperIdType,
        name: "pitch",
      })?.value as PitchOptions;
      this.source.playbackRate = this.calculateSampleRate(storedPitch.pitch);
    } catch (e) {
      console.log("load initial sample error : ", e);
    }
  }

  private loadEffects() {
    this.initializeEffects();
    const trackNodes =
      this.effects.length > 0
        ? (this.effects?.map((effect) => effect.node) as Tone.ToneAudioNode[])
        : [];
    // Channel is added first so that the panning is done by our own Tone.Panner which is added after it
    trackNodes.unshift(this.channel as Tone.ToneAudioNode);
    this.source?.chain(
      ...trackNodes,
      ...Audio.getMasterNodes(),
      Tone.getDestination(),
    );
  }

  private initializeEffects() {
    const effects = State.getStepperEffects(
      parseInt(this.stepperId) as StepperIdType,
    );
    if (!this.channel) {
      this.channel = new Tone.Channel({});
    }
    if (effects) {
      this.effects = effects?.map((effect) => {
        const node = Audio.createEffect(effect.name, effect.value);
        return {
          name: effect.name,
          node,
        };
      });
    } else {
      this.effects = Audio.defaultEffects;
    }
  }

  public async loadSample(sampleId: string) {
    try {
      const path = SampleRegistry.resolvePath(sampleId);
      if (path) {
        await this?.source?.load(path);
        if (!this.source) throw new Error("NO SOURCE !");
      }
    } catch (e) {
      console.log("sample loading error : ", e);
    }
  }

  public playSample(time: number = 0) {
    if (
      Controls.isPlaying &&
      this.source?.buffer &&
      this.source.buffer.loaded &&
      !this.muted // should work out of the box but sample sometimes play eventhough it is muted
    ) {
      this.source?.start(time, 0, Tone.now() + this.source.buffer.duration);
    }
  }

  private handleEffectUpdate = (update: EffectUpdate) => {
    const updateFn = this.effectUpdateMethodsMap.get(update.name);
    if (updateFn) updateFn(update);
  };

  private handleChannelUpdate = () => {
    const channelOptions = State.getChannelOptions(
      parseInt(this.stepperId) as StepperIdType,
    );
    if (channelOptions) {
      this?.channel?.set(channelOptions);
    }
  };

  private handleDelayUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "delay");
    if (!effect || !effect.node) return;
    const delayOptions = value.value as Tone.FeedbackDelayOptions;
    effect?.node.set({ ...delayOptions });
  };

  private handleReverbUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "reverb");
    if (!effect || !effect.node) return;
    const options = value.value as Tone.ReverbOptions;
    effect?.node.set({ ...options });
  };

  private handlePitchUpdate = (value: EffectUpdate) => {
    const pitchOptions = value.value as PitchOptions;
    const pitch = pitchOptions.pitch;
    this!.source!.playbackRate = this.calculateSampleRate(pitch);
  };

  private calculateSampleRate(pitch: number) {
    let ratio = DEFAULT_SAMPLE_RATE;
    if (pitch === 0) return ratio;
    if (pitch < 0) {
      const amplitude = 1 - MIN_SAMPLE_RATE;
      const stepValue = amplitude / (1 / MIN_SAMPLE_RATE);
      ratio = 1 - stepValue * Math.abs(pitch);
    }
    if (pitch > 0) {
      ratio = 1 + pitch * 0.5;
      ratio =
        1 +
        (pitch * (MAX_SAMPLE_RATE - DEFAULT_SAMPLE_RATE)) /
          (1 / MIN_SAMPLE_RATE);
    }
    return ratio;
  }

  private initializeUpdateMethods() {
    this.effectUpdateMethodsMap.set("delay", this.handleDelayUpdate);
    this.effectUpdateMethodsMap.set("reverb", this.handleReverbUpdate);
    this.effectUpdateMethodsMap.set("pitch", this.handlePitchUpdate);
  }

  get muted() {
    return !!this.channel?.muted;
  }

  private listenToResize() {
    this.resizeSubscription = State.stepperResizeSubject
      .pipe(
        tap(() => {
          State.steppersLoadingSubject.next(true);
        }),
      )
      .pipe(debounceTime(DEBOUNCE_TIME_MS))
      .pipe(filter(({ stepperId }) => stepperId === parseInt(this.stepperId)))
      .subscribe(({ oldSteps }) => {
        if (this.steps !== null) {
          Pulses.update(this, oldSteps, this.steps);
        }
        State.steppersLoadingSubject.next(false);
      });
  }
  private isSelectedStep({
    totalSteps,
    stepNumber,
  }: {
    totalSteps: number;
    stepNumber: number;
  }) {
    const stepperOptions = State.getStepperOptions(
      parseInt(this.stepperId) as StepperIdType,
    );
    if (!stepperOptions) return false;
    const selectedSteps = stepperOptions.selectedSteps;
    const steps = stepperOptions.beats * stepperOptions.stepsPerBeat;
    if (!selectedSteps) return false;
    if (totalSteps === steps) return !!selectedSteps[stepNumber];
    const parentChildRatio = totalSteps / steps;
    const actualStep = stepNumber / parentChildRatio;
    return Number.isInteger(actualStep) && !!selectedSteps[actualStep];
  }

  listenToPulse(pulse: Pulse) {
    if (this.pulseSubscription) {
      this.pulseSubscription?.unsubscribe();
    }
    this.pulseSubscription = pulse.currentStepSubject
      // Only trigger if note is selected
      .pipe(
        filter(({ stepNumber, totalSteps }) => {
          return this.isSelectedStep({ totalSteps, stepNumber });
        }),
      )
      .pipe(
        tap(({ time }) => {
          try {
            this?.playSample(time);
          } catch (e) {
            // an error related to tone.player note timing actually takes place here
            // it is non blocking but it does paint the console red...
            // the error is way worse when Tone.now is not added to the offset parameter in Tone.player.start()
            console.error("[Stepper] Error playing sample:", e);
            // Don't propagate the error - keep the subscription alive
          }
        }),
      )
      .subscribe();
  }

  get steps() {
    const stepperOptions = State.getStepperOptions(
      parseInt(this.stepperId) as StepperIdType,
    );
    if (!stepperOptions) return null;
    return stepperOptions.beats * stepperOptions.stepsPerBeat;
  }
}

export default Track;
