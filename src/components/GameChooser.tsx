import React, { ChangeEvent, useState, useEffect } from "react";
import { bulls } from "../games/bulls";
import { cricket } from "../games/cricket";
import { ohGames } from "../games/oh1";
import { useStore } from "../machine";
import { Game, Multiple, GameName } from "../types";
import isBlank from "@sedan-utils/is-blank";
import { cutThroat } from "../games";

import "./GameChooser.css";
import { tactical } from "../games/tactical";

const voiceSortCompare = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => a.lang.localeCompare(b.lang);

const isAndroid = window?.navigator?.userAgent?.indexOf("Android") !== -1;

export const GameChooser: React.FC<{ singlePlayer: boolean }> = ({ singlePlayer }) => {
  const chooseGame = useStore((state) => state.setGame);
  const setUseSound = useStore((state) => state.setUseSound);
  const useSound = useStore((state) => state.useSound);
  const voiceIndex = useStore((state) => state.voiceIndex);
  const setVoiceIndex = useStore((state) => state.setVoiceIndex);
  const lastGameSettings = useStore((state) => state.lastGameSettings);

  const [getGame, setGame] = useState<Game>(null);
  const [getOh1Limit, setOh1Limit] = useState(301);
  const [getPointing, setPointing] = useState(false);
  const [getNumberOfBulls, setNumberOfBulls] = useState(25);
  const [getIn, setIn] = useState(Multiple.Single);
  const [getOut, setOut] = useState(Multiple.Single);
  const [hasError, setError] = useState(false);

  // this does not work until the user clicks a button
  const voices = window.speechSynthesis?.getVoices();

  // Update settings when game type is selected
  useEffect(() => {
    if (getGame?.name && lastGameSettings[getGame.name]) {
      const settings = lastGameSettings[getGame.name];
      if (settings.checkIn !== undefined) setIn(settings.checkIn || Multiple.Single);
      if (settings.checkOut !== undefined) setOut(settings.checkOut || Multiple.Single);
      if (settings.pointing !== undefined && !singlePlayer) setPointing(settings.pointing);
      
      // Set appropriate limit based on game type
      if (getGame.name === GameName.Bulls && settings.limit) {
        setNumberOfBulls(Math.floor(settings.limit / 25));
      } else if (getGame.name === GameName.Oh1 && settings.limit) {
        setOh1Limit(settings.limit);
      }
    }
  }, [getGame?.name, lastGameSettings, singlePlayer]);

  const onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);

    if (isBlank(value) || value < 10) {
      setError(true);
    } else {
      setError(false);
    }

    setOh1Limit(value);
  };

  const onNumberOfBulls = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);

    if (isBlank(value) || value < 3 || value > 100) {
      setError(true);
    } else {
      setError(false);
    }

    setNumberOfBulls(value);
  };

  const onInChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setIn(value as unknown as Multiple);
  };

  const onOutChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setOut(value as unknown as Multiple);
  };

  const onPointingChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPointing(event.target.checked);
  };

  const onVoiceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const index = Number(event.target.value);
    const voice = voices[index];
    const utterance = new SpeechSynthesisUtterance(voice.name);
    utterance.voice = voice;

    setVoiceIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const pointing = singlePlayer ? false : getPointing;

  const toggleUseSound = () => setUseSound(!useSound);

  return (
    <>
      <div className="options">
        <label>
          Sounds ?
          <input type="checkbox" checked={useSound} onChange={toggleUseSound} />
        </label>
        {useSound && !isAndroid && voices && voices.length !== 0 && (
          <div>
            <label>
              Voice{" "}
              <select className="voice" onChange={onVoiceChange} value={isBlank(voiceIndex) ? "" : voiceIndex}>
                {voices
                  .slice()
                  .sort(voiceSortCompare)
                  .map((v) => {
                    const voiceIdx = voices.findIndex((vo) => vo.lang === v.lang && vo.name === v.name);
                    return (
                      <option key={v.name} value={voiceIdx}>
                        {v.lang} - {v.name}
                      </option>
                    );
                  })}
              </select>
            </label>
          </div>
        )}
      </div>
      <div className="games">
        <button
          onClick={(event) => {
            event.preventDefault();
            setGame(bulls());
          }}
        >
          Bulls {getGame?.name === GameName.Bulls && <span>!!</span>}
        </button>

        <button
          onClick={(event) => {
            event.preventDefault();
            setGame(cricket(getPointing));
          }}
        >
          Cricket {getGame?.name === GameName.Cricket && <span>!!</span>}
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            setGame(tactical(getPointing));
          }}
        >
          Tactical {getGame?.name === GameName.Tactical && <span>!!</span>}
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            setGame(ohGames(Number(getOh1Limit)));
          }}
        >
          Oh 1 {getGame?.name === GameName.Oh1 && <span>!!</span>}
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            setGame(cutThroat());
          }}
        >
          Cut Throat {getGame?.name === GameName.CutThroat && <span>!!</span>}
        </button>
      </div>
      {getGame && getGame.name === GameName.Cricket && (
        <a target={"_blank"} href="https://en.wikipedia.org/wiki/Cricket_(darts)">
          The game of Cricket
        </a>
      )}
      {getGame && getGame.name === GameName.Oh1 && (
        <a target={"_blank"} href="https://en.wikipedia.org/wiki/Darts#Games">
          The game of Darts
        </a>
      )}
      {getGame && (
        <div className="options">
          {getGame?.limit !== 0 && getGame.name === GameName.Oh1 && (
            <div>
              <input maxLength={4} type="number" max={9999} min={3} value={getOh1Limit} onChange={onLimitChange} />
              limit
              {hasError && <span>invalid value</span>}
            </div>
          )}

          {![GameName.Bulls, GameName.Oh1, GameName.CutThroat].includes(getGame.name) && (
            <div>
              <label>
                <input type="checkbox" disabled={singlePlayer} checked={pointing} onChange={onPointingChange} />
                pointing ?
              </label>
              {hasError && <span>invalid value</span>}
            </div>
          )}

          {getGame.name === GameName.Bulls && (
            <div>
              <input
                maxLength={3}
                type="number"
                max={100}
                min={3}
                value={getNumberOfBulls}
                onChange={onNumberOfBulls}
              />
              Number of Bulls
              {hasError && <span>invalid value</span>}
            </div>
          )}

          {![GameName.Bulls, GameName.Cricket, GameName.Tactical, GameName.CutThroat].includes(getGame.name) && (
            <>
              <div>
                <select onChange={onInChange} value={getIn}>
                  <option value={Multiple.Single}>Single</option>
                  <option value={Multiple.Double}>Double</option>
                  <option value={Multiple.Triple}>Triple</option>
                </select>{" "}
                in
                {hasError && <span>invalid value</span>}
              </div>
              <div>
                <select onChange={onOutChange} value={getOut}>
                  <option value={Multiple.Single}>Single</option>
                  <option value={Multiple.Double}>Double</option>
                  <option value={Multiple.Triple}>Triple</option>
                </select>{" "}
                out
                {hasError && <span>invalid value</span>}
              </div>
            </>
          )}

          <button
            style={{ flex: 1, fontSize: "2em", padding: "0 1em", marginTop: "0.77em" }}
            onClick={(event) => {
              event.preventDefault();

              let limit = 0;
              let checkIn = getIn;
              let checkOut = getOut;

              if (getGame?.name === GameName.Oh1) {
                if (isBlank(getOh1Limit)) {
                  setError(true);
                  return;
                }
                limit = getOh1Limit;
              } else if (getGame?.name === GameName.Bulls) {
                limit = getNumberOfBulls * 25;
                checkIn = Multiple.Single;
                checkOut = Multiple.Single;
              } else if (getGame?.name === GameName.Cricket) {
                limit = getGame.limit;
                checkIn = null;
                checkOut = null;
              }

              let arePointing = getPointing;

              if (getGame?.name === GameName.CutThroat) {
                limit = 0;
                checkIn = null;
                checkOut = null;
                arePointing = true;
              }

              chooseGame({
                name: getGame.name,
                checkIn,
                checkOut,
                limit,
                marks: getGame.marks,
                multiples: getGame.multiples,
                clear: getGame.clear,
                pointing: arePointing,
              });
            }}
          >
            start
          </button>
        </div>
      )}
    </>
  );
};
