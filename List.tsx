import {
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { VolumeDown, VolumeUp } from '@material-ui/icons'

import styleText from 'data-text:./content.module.css'
import * as style from './content.module.css'
export const getStyle = () => {
  const style = document.createElement('style')
  style.textContent = styleText
  return style
}
import { speechLangs } from './speechLangs'
export function MenuList({
  userLang,
  setUserLang,
  rate,
  setRate,
  volume,
  setVolume,
  pitch,
  setPitch,
  answerLang,
  setAnswerLang,
  recognitionStopWord,
  setRecognitionStopWord,
  stopAnswerWord,
  setStopAnswerWord,
}) {
  const language = window.speechSynthesis.getVoices()

  return (
    <div className={style.rightMenuContainer}>
      <List>
        <ListItem>
          <Grid container spacing={2} alignContent="center" alignItems="center">
            <Grid item>voice language:</Grid>
            <Grid item>
              <FormControl>
                <Select
                  labelId="demo-simple-select-helper-label"
                  id="demo-simple-select-helper"
                  value={userLang}
                  onChange={(event) =>
                    setUserLang(event.target.value as string)
                  }
                >
                  {speechLangs.map(([name, value], i) => {
                    return (
                      <MenuItem key={name} value={value}>
                        {name}
                      </MenuItem>
                    )
                  })}
                </Select>
                <FormHelperText>
                  please choose your voice language
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <Grid container spacing={2} alignContent="center" alignItems="center">
            <Grid item>answer language:</Grid>
            <Grid item>
              <FormControl>
                <Select
                  labelId="demo-simple-select-helper-label"
                  id="demo-simple-select-helper"
                  value={answerLang}
                  onChange={(event) => {
                      setAnswerLang(event.target.value as string)
                  }}
                >
                  {language.map((item) => {
                    return (
                      <MenuItem key={item.name} value={item.lang}>
                        {item.name}
                      </MenuItem>
                    )
                  })}
                </Select>
                <FormHelperText>
                  please choose your answer language
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </ListItem>

        <ListItem>
          <Grid
            container
            spacing={2}
            alignContent="flex-end"
            alignItems="flex-end"
          >
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                stop voice word:
              </Typography>
            </Grid>
            <Grid item>
              <TextField
                onChange={(event) => setRecognitionStopWord(event.target.value)}
                value={recognitionStopWord}
              />
            </Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <FormHelperText>
            chatGpt can to say answer when you use player record and say stop
            voice word
          </FormHelperText>
        </ListItem>
        <ListItem>
          <Grid
            container
            spacing={2}
            alignContent="flex-end"
            alignItems="flex-end"
          >
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                stop answer word:
              </Typography>
            </Grid>
            <Grid item>
              <TextField
                onChange={(event) => setStopAnswerWord(event.target.value)}
                value={stopAnswerWord}
              />
            </Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <FormHelperText>
            chatGpt could stop answer when you say stop answer word
          </FormHelperText>
        </ListItem>
        <ListItem>
          <Grid container spacing={2} alignContent="center" alignItems="center">
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                pitch:
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                onChange={(event) => setPitch(event.target.value)}
                value={pitch}
                inputProps={{
                  max: 2,
                  min: 0.1,
                  step: '0.1',
                }}
                type="number"
              />
            </Grid>
          </Grid>
        </ListItem>

        <ListItem>
          <Grid container spacing={2} alignContent="center" alignItems="center">
            <Grid item>
              <Typography id="discrete-slider" gutterBottom>
                rate:
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                onChange={(event) => setRate(event.target.value)}
                value={rate}
                inputProps={{
                  max: 2,
                  step: '0.1',
                  min: 0.1,
                }}
                type="number"
              />
            </Grid>
            <Grid item></Grid>
          </Grid>
        </ListItem>
        <ListItem>
          <Grid container spacing={2} alignContent="center" alignItems="center">
            <Grid item>volume:</Grid>
            <Grid item>
              <div onClick={() => setVolume(0)}>
                <VolumeDown />
              </div>
            </Grid>
            <Grid item xs>
              <Slider
                value={volume}
                step={0.1}
                max={2}
                min={0}
                getAriaValueText={(v) => `${v}`}
                aria-labelledby="continuous-slider"
                onChange={throttle((e, v) => setVolume(v), 300)}
                valueLabelDisplay="on"
              />
            </Grid>
            <Grid item>
              <VolumeUp />
            </Grid>
          </Grid>
        </ListItem>
      </List>
    </div>
  )
}

function throttle(func, wait) {
  let timerId = null
  let lastExecTime = 0
  return function () {
    const context = this
    const args = arguments
    const currentTime = Date.now()
    const timeSinceLastExec = currentTime - lastExecTime
    if (timeSinceLastExec > wait) {
      func.apply(context, args)
      lastExecTime = currentTime
    } else if (!timerId) {
      timerId = setTimeout(() => {
        func.apply(context, args)
        lastExecTime = Date.now()
        timerId = null
      }, wait - timeSinceLastExec)
    }
  }
}
