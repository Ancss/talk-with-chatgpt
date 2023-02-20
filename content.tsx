import Button from '@material-ui/core/Button'
import Fab from '@material-ui/core/Fab/Fab'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton/IconButton'
import makeStyles from '@material-ui/core/styles/makeStyles'
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm'
import HeadsetIcon from '@material-ui/icons/Headset'
import KeyboardVoiceIcon from '@material-ui/icons/KeyboardVoice'
import SettingsIcon from '@material-ui/icons/Settings'
import TelegramIcon from '@material-ui/icons/Telegram'
import VolumeMuteOutlinedIcon from '@material-ui/icons/VolumeMuteOutlined'
import VolumeMuteIcon from '@material-ui/icons/VolumeMute'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'
import Drawer from '@material-ui/core/Drawer'
import TextField from '@material-ui/core/TextField'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import Divider from '@material-ui/core/Divider'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Slider from '@material-ui/core/Slider'
import VolumeDown from '@material-ui/icons/VolumeDown'
import VolumeUp from '@material-ui/icons/VolumeUp'
import iconBg from 'data-base64:~assets/icon.png'
import playerControllerBg from 'data-base64:~assets/playerController.png'
import recordPlayerBg from 'data-base64:~assets/recordPlayer.png'
import styleText from 'data-text:./content.module.css'
// import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

// import * as webkitSpeechRecognition from 'webkitSpeechRecognition';

import { useStorage } from '@plasmohq/storage/dist/hook'

import * as style from './content.module.css'

declare var webkitSpeechRecognition: any
// declare var webkitSpeechGrammarList: any
// declare var webkitSpeechRecognitionEven: any
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
// var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
// var SpeechRecognitionEvent =
//   SpeechRecognitionEvent || webkitSpeechRecognitionEven
const synth = window.speechSynthesis
let currentPathName = location.pathname
let stopSpeechId = null
const sentenceSymbolReg = /[\u002c\u3001\u002e\u003f\u0021\u003b\u003a\u061b\u061f\u002e\u2026\uff01-\uff0f\uff1a-\uff1b\uff1f-\uff5e\u3002\uff0c\uff1f\uff01\uff1b\uff1a]/g
export const getStyle = () => {
  const style = document.createElement('style')
  style.textContent = styleText
  return style
}
enum playerStatus {
  BeforeListenVoice,
  ListenVoicing,
  SendChatMessage,
  Speechling,
  Speechend,
  SpeechPause,
  SpeechStop,
  SpeechContinue,
}
let prevPlayerStatus: playerStatus = null

let isListening = false
export const config = {
  matches: ['https://chat.openai.com/chat*'],
}
let recognition = null
let utterance: SpeechSynthesisUtterance = null

function initListen({
  userLang,
  rate,
  pitch,
  answerLang,
  volume,
  recognitionStopWord,
  StopAnswerWord,
  currentPlayerStatus,
  setCurrentPlayerStatus,
}) {
  function startListen() {
    clearInterval(stopSpeechId)
    synth.pause()
    synth.cancel()
    setCurrentPlayerStatus(playerStatus.ListenVoicing)
    if (!recognition) {
      recognition = new SpeechRecognition()
      recognition.start()
    }
    recognition.lang = userLang ? userLang : ''
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = function (event) {
      console.log('recognition start')
    }
    recognition.onresult = (event) => {
      console.log(event)
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) text += event.results[i][0].transcript
      }
      const StopAnswerWordIndex = text
        .replace(/\s/g, '')
        .toLowerCase()
        .indexOf(StopAnswerWord.replace(/\s/g, '').toLowerCase())

      if (StopAnswerWordIndex > -1) {
        toStopAnswer(setCurrentPlayerStatus)
        return
      } else if (!isListening || synth.speaking) {
        return
      }
      const input = document.querySelector('textarea')
      const stopWordIndex = text.indexOf(recognitionStopWord)
      // stop recognize and send text to chatGpt when recognize stop word
      if (stopWordIndex > -1) {
        input.value += text.slice(0, stopWordIndex)
        sendMessage()
        return
      }
      input.value += text + ' '
    }
    recognition.onnomatch = function (event) {
      console.log('recognition nomatch')
      recognition.abort()
    }
    recognition.onerror = function (event) {
      console.log('recognition error', event)
      // recognition.abort()
    }
    recognition.onend = function (event) {
      console.log('recognition end ',event)
      recognition.start()
    }
  }

  function startSpeechWork() {
    setCurrentPlayerStatus(playerStatus.Speechling)

    stopSpeechId = setInterval(() => {
      startSpeech({ volume, answerLang, rate, pitch }, setCurrentPlayerStatus)
    }, 500)
  }
  function sendMessage() {
    const input = document.querySelector('textarea')
    if (!input.value.trim()) {
      return
    }
    setCurrentPlayerStatus(playerStatus.SendChatMessage)
    const button = input.nextElementSibling
    ;(button as HTMLElement).click()
    startSpeechWork()
  }
  function speechPause(currentPlayerStatus) {
    prevPlayerStatus = currentPlayerStatus
    setCurrentPlayerStatus(playerStatus.SpeechPause)
    synth.pause()
  }
  function speechStop(currentPlayerStatus) {
    prevPlayerStatus = currentPlayerStatus
    clearInterval(stopSpeechId)
    setCurrentPlayerStatus(playerStatus.BeforeListenVoice)
    synth.cancel()
  }
  function speechContinue() {
    console.log({ prevPlayerStatus })
    setCurrentPlayerStatus(prevPlayerStatus)
    synth.resume()
    if (!synth.speaking && prevPlayerStatus > 2) {
      setCurrentPlayerStatus(playerStatus.ListenVoicing)
    }
  }
  return {
    startListen,
    startSpeechWork,
    sendMessage,
    speechPause,
    speechStop,
    speechContinue,
  }
}
let prevMessageLen = 0
let prevText = ''
let currentMessageStep = 0
let currentMessageDom: Element = null
function startSpeech(
  { volume, answerLang, rate, pitch },
  setCurrentPlayerStatus,
) {
  const currentMessage = document.querySelectorAll('.text-base')
  if (currentMessage.length > prevMessageLen) {
    prevMessageLen = currentMessage.length
    currentMessageStep = 0
    currentMessageDom = currentMessage[currentMessage.length - 1]
  }
  if (currentMessageDom) {
    const text = currentMessageDom.textContent
    if (text !== prevText) {
      prevText = text
      const sentences = text.split(sentenceSymbolReg)
      console.log(sentences, currentMessageStep)
      for (let i = currentMessageStep; i < sentences.length; i++) {
        // if last item is not '' , the segment is not done;
        if (
          currentMessageStep + 1 === sentences.length &&
          sentences[sentences.length - 1].trim() !== ''
        ) {
          return
        }
        if (sentences[i].trim()) {
          currentMessageStep += 1
          toSpeak(
            sentences[i],
            { volume, answerLang, rate, pitch },
            setCurrentPlayerStatus,
          )
        }
      }
    }
  }
}
let toStopAnswerId = null
let toStopAnswerIdCount = 0
function toStopAnswer(setCurrentPlayerStatus) {
  toStopAnswerIdCount++
  const button = document
    .querySelector('.stretch')
    .querySelectorAll('button')[0]
  // when user say stopAnswerWord,but now is not Stop generating button,
  // so we need await the button to visible
  if (button.textContent === 'Stop generating' || toStopAnswerIdCount >= 20) {
    toStopAnswerIdCount = 0
    button?.click()
    synth.cancel()
    setCurrentPlayerStatus(playerStatus.ListenVoicing)
    clearTimeout(toStopAnswerId)
  } else {
    toStopAnswerId = setTimeout(() => {
      clearTimeout(toStopAnswerId)
      toStopAnswer(setCurrentPlayerStatus)
    }, 100)
  }
}
function toSpeak(
  sentence,
  { volume, answerLang, rate, pitch },
  setCurrentPlayerStatus,
) {
  if (utterance) {
    utterance.onend = null
    utterance = null
  }
  utterance = new SpeechSynthesisUtterance()
  utterance.volume = volume
  utterance.lang = answerLang
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.text = sentence
  synth.speak(utterance)
  utterance.onerror = (e) => {
    console.log({ e })
    utterance.onend(e)
  }
  utterance.onend = () => {
    if (!synth.speaking) {
      setCurrentPlayerStatus(playerStatus.ListenVoicing)
    }
    console.log('synth.speaking', synth.speaking)
    console.log('utterance.onend')
  }
}

function initVarStatus(setCurrentPlayerStatus) {
  // Todo: popstate event not be invoke
  // if someone know why,please contact with me or create a pr,thanks
  window.addEventListener('popstate', function () {
    console.log({ currentPathName })
    // 检查当前的pathname是否与存储的pathname不同
    if (window.location.pathname !== currentPathName) {
      setCurrentPlayerStatus(playerStatus.BeforeListenVoice)
      currentPathName = location.pathname
      prevMessageLen = 0
      prevText = ''
      currentMessageStep = 0
      currentMessageDom = null
    }
  })
}
let mountVolumeTimeID = null
function mountVolumeIcon({
  setCurrentPlayerStatus,
  volume,
  answerLang,
  rate,
  pitch,
}) {
  mountVolumeTimeID = setTimeout(() => {
    clearTimeout(mountVolumeTimeID)
    mountVolumeIcon({
      setCurrentPlayerStatus,
      volume,
      answerLang,
      rate,
      pitch,
    })
    const answerLineButtons = document.querySelectorAll('.self-end')
    answerLineButtons.forEach((dom) => {
      if ([...dom.children].some((d) => d.className.includes('volumeIcon'))) {
        return
      }
      const div = document.createElement('span')
      div.className = 'volumeIcon'
      const root = createRoot(div)
      root.render(
        <VolumeIcon
          setCurrentPlayerStatus={setCurrentPlayerStatus}
          volume={volume}
          answerLang={answerLang}
          rate={rate}
          pitch={pitch}
        />,
      )
      dom.appendChild(div)
    })
  }, 5000)
}
function VolumeIcon({
  setCurrentPlayerStatus,
  volume,
  answerLang,
  rate,
  pitch,
}) {
  const [isPlay, setPlay] = useState(false)
  const volumeIcon = useRef(null)
  function onClick() {
    if (isPlay) {
      synth.cancel()
      setCurrentPlayerStatus(playerStatus.ListenVoicing)
      setPlay(false)
    } else {
      setCurrentPlayerStatus(playerStatus.Speechling)
      const textContent = volumeIcon.current.closest('.text-base').textContent
      const sentences = textContent.split(sentenceSymbolReg)
      if (synth.paused) {
        synth.resume()
      }
      setPlay(true)
      for (let i = 0; i < sentences.length; i++) {
        function setStatus(status) {
          setPlay(false)
          setCurrentPlayerStatus(status)
        }
        toSpeak(sentences[i], { volume, answerLang, rate, pitch }, setStatus)
      }
    }
  }
  return (
    <span
      style={{ cursor: 'pointer' }}
      onClick={() => onClick()}
      ref={(ref) => {
        volumeIcon.current = ref
      }}
    >
      {isPlay ? <VolumeUpIcon /> : <VolumeMuteOutlinedIcon />}
    </span>
  )
}
function IndexContent() {
  const [currentPlayerStatus, setCurrentPlayerStatus] = useStorage<number>(
    'currentPlayerStatus',
    playerStatus.BeforeListenVoice,
  )

  useEffect(() => {
    initVarStatus(setCurrentPlayerStatus)
    setCurrentPlayerStatus(playerStatus.BeforeListenVoice)
    if (synth.pending || synth.speaking) {
      synth.cancel()
    }
    return () => {
      recognition?.abort()
      synth.cancel()
    }
  }, [])
  const [bg, setBg] = useStorage<string>('recordPlayerBg', '')
  const [userLang, setUserLang] = useStorage<string>('userLang', 'en-US')
  const [rate, setRate] = useStorage<number>('speechRate', 1)
  const [pitch, setPitch] = useStorage<number>('speechPitch', 0.5)
  const [answerLang, setAnswerLang] = useStorage<string>('answerLang', '')
  const [volume] = useStorage<number>('answerVolume', 1)
  const [recognitionStopWord, setRecognitionStopWord] = useStorage(
    'recognitionStopWord',
    'stop',
  )
  const [StopAnswerWord, setStopAnswerWord] = useStorage(
    'StopAnswerWord',
    'stop answer',
  )

  mountVolumeIcon({ setCurrentPlayerStatus, volume, answerLang, rate, pitch })

  const {
    startListen,
    startSpeechWork,
    sendMessage,
    speechPause,
    speechStop,
    speechContinue,
  } = initListen({
    userLang,
    rate,
    pitch,
    answerLang,
    volume,
    StopAnswerWord,
    recognitionStopWord,
    currentPlayerStatus,
    setCurrentPlayerStatus,
  })
  useEffect(() => {
    isListening = currentPlayerStatus === playerStatus.ListenVoicing
  }, [currentPlayerStatus])
  function toggleStatus(isController) {
    // click the controller to pause or resume
    // when isController is true ,we not to be listen user speak
    // 不会有监听用户说话的操作
    if (isController) {
      if (currentPlayerStatus === playerStatus.SpeechPause) {
        speechContinue()
        return
      } else {
        speechPause(currentPlayerStatus)
        return
      }
    }
    // click player record center,currentPlayerStatus maybe is
    // start listen user saying
    // listen is end and to send message
    // get chatGpt answer message and play
    // we start listen user speak when we click the playing record
    if (currentPlayerStatus === playerStatus.BeforeListenVoice) {
      startListen()
    } else if (currentPlayerStatus === playerStatus.ListenVoicing) {
      sendMessage()
    } else if (currentPlayerStatus === playerStatus.SendChatMessage) {
      startSpeechWork()
    } else if (currentPlayerStatus === playerStatus.Speechling) {
      startListen()
    }
  }
  let [showDrawer, setShowDrawer] = useState(false)
  // 点击弹出抽屉
  function popupDrawer() {
    setShowDrawer(!showDrawer)
  }
  // 获取当前浏览器支持的所有语言
  // console.log(
  //   '获取当前浏览器支持的所有语言',
  //   window.speechSynthesis.getVoices()
  // )
  const language = window.speechSynthesis.getVoices()
  console.log('rate', rate)
  console.log('pitch', pitch)
  const list = () => (
    <div>
      <List>
        <ListItem>
          <TextField
            onChange={(event) => setBg(event.target.value)}
            label="recordPlayerBg"
          />
        </ListItem>

        <Divider />
        <ListItem>
          <FormControl>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={userLang}
              onChange={(event) => setUserLang(event.target.value as string)}
            >
              {language.map((item) => {
                return (
                  <MenuItem key={item.name} value={item.lang}>
                    {item.name}
                  </MenuItem>
                )
              })}
            </Select>
            <FormHelperText>Some important helper text</FormHelperText>
          </FormControl>
        </ListItem>
        <ListItem>
          <Grid container spacing={2}>
            <Grid item>
              <VolumeDown />
            </Grid>
            <Grid item xs>
              <Slider value={rate * 100} aria-labelledby="continuous-slider" />
            </Grid>
            <Grid item>
              <VolumeUp />
            </Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <Grid container spacing={2}>
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                multiple
              </Typography>
            </Grid>
            <Grid item xs>
              <Slider
                value={pitch * 100}
                aria-labelledby="continuous-slider"
                onChange={(e, newValue) => setPitch((newValue as number) / 100)}
                min={10}
                max={200}
              />
            </Grid>
            <Grid item></Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <FormControl>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={answerLang}
              onChange={(event) => setAnswerLang(event.target.value as string)}
            >
              {language.map((item) => {
                return (
                  <MenuItem key={item.name} value={item.lang}>
                    {item.name}
                  </MenuItem>
                )
              })}
            </Select>
            <FormHelperText>Some important helper text</FormHelperText>
          </FormControl>
        </ListItem>
        <ListItem>
          <Grid container spacing={2}>
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                volume
              </Typography>
            </Grid>
            <Grid item xs>
              <Slider
                value={volume * 100}
                aria-labelledby="continuous-slider"
              />
            </Grid>
            <Grid item></Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <TextField
            onChange={(event) => setRecognitionStopWord(event.target.value)}
            label="recognitionStopWord"
          />
        </ListItem>
        <ListItem>
          <TextField
            onChange={(event) => setStopAnswerWord(event.target.value)}
            label="StopAnswerWord"
          />
        </ListItem>
      </List>
    </div>
  )

  const isUseAnimating = useMemo<boolean>(
    () =>
      ![
        playerStatus.BeforeListenVoice,
        // playerStatus.SendChatMessage,
        playerStatus.SpeechPause,
        playerStatus.SpeechStop,
        playerStatus.Speechend,
      ].includes(currentPlayerStatus),
    [currentPlayerStatus],
  )

  return (
    <div className={style.talkContainer}>
      <img
        width={'100%'}
        className={[
          style.recordPlayer,
          isUseAnimating ? style.playerPlaying : '',
        ].join(' ')}
        src={recordPlayerBg}
        alt=""
      />
      <img
        className={[
          style.playerController,
          isUseAnimating ? style.controllerOnPlayer : '',
        ].join(' ')}
        onClick={() => toggleStatus(true)}
        src={playerControllerBg}
        alt=""
      />
      <div
        className={[style.innerContainer].join(' ')}
        onClick={() => toggleStatus(false)}
      >
        <img className={style.innerPlayerBg} src={bg ? bg : iconBg} alt="" />
        <StatusComponentIcon
          className={isUseAnimating ? style.breathBg : ''}
          currentPlayerStatus={currentPlayerStatus}
        ></StatusComponentIcon>
      </div>
      <SettingsIcon
        onClick={() => popupDrawer()}
        className={`${style.settingsButton} ${
          isUseAnimating ? style.playerPlayingReverse : ''
        }`}
      />
      <Drawer
        anchor="right"
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
      >
        {list()}
      </Drawer>
    </div>
  )
}
export default IndexContent

function StatusComponentIcon({ currentPlayerStatus, className }) {
  const classNames = [style.innerPlayerBg, className].join(' ')

  return currentPlayerStatus === playerStatus.BeforeListenVoice ? (
    <KeyboardVoiceIcon
      className={classNames}
      style={{ backgroundColor: 'rgba(135, 206, 235,0.2)' }}
    />
  ) : currentPlayerStatus === playerStatus.ListenVoicing ? (
    <KeyboardVoiceIcon className={classNames} />
  ) : currentPlayerStatus === playerStatus.SendChatMessage ? (
    <TelegramIcon className={classNames} />
  ) : currentPlayerStatus === playerStatus.Speechling ? (
    <HeadsetIcon className={classNames} />
  ) : currentPlayerStatus === playerStatus.SpeechPause ? (
    prevPlayerStatus > 2 ? (
      <HeadsetIcon
        className={classNames}
        style={{ backgroundColor: 'rgba(135, 206, 235,0.2)' }}
      />
    ) : (
      <KeyboardVoiceIcon
        className={classNames}
        style={{ backgroundColor: 'rgba(135, 206, 235,0.2)' }}
      />
    )
  ) : (
    <div> </div>
  )
}
