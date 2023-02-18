import { useStorage } from "@plasmohq/storage/dist/hook"
import TextField from '@material-ui/core/TextField';

function IndexPopup() {
  const [bg, setBg] = useStorage("recordPlayerBg", "")
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width:'400px'
      }}>
      <TextField id="standard-basic" value={bg} onChange={(e)=>setBg(e.target.value)} label="please input record player background image address" />
    </div>
  )
}

export default IndexPopup
