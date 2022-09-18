const fs = require("fs")

let buf = fs.readFileSync("toimi.wasm")
let buf2 = ""


console.log(buf[1].toString(16).toString())


const getDoubleCharacter = (proposal) => {

    if (proposal <= 15) {
        return "0x0" + proposal.toString(16).toString().toUpperCase() + ","
    }
    
    return "0x" + proposal.toString(16).toString().toUpperCase() + ","


}


{/* <Buffer 00 61 73 6d 01 00 00 00 01 a4 82 80 80 00 2d 60 01 7f 01 7f 60 03 7f 7f 7f 01 7f 60 02 7f 7f 01 7f 60 00 01 7f 60 0 */}

for (let i = 0; i < buf.length; i++) {
    buf2 += getDoubleCharacter(buf[i])
}

buf2 = buf2.slice(0, -1)

fs.writeFile("output.txt", buf2, "binary", (err) => console.log("err", err))
