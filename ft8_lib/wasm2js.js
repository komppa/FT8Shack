const fs = require("fs")

const [ inputFile ] = process.argv.slice(2)
const [ outputFile ] = inputFile.split(".")

console.log(`Using "${inputFile}" as a input file`)
console.log(`Output file will be named as "${outputFile}`)

let buf = fs.readFileSync(inputFile)
let buf2 = ""


console.log(buf[1].toString(16).toString())


const getDoubleCharacter = (proposal) => {

    if (proposal <= 15) {
        return "0x0" + proposal.toString(16).toString().toUpperCase() + ","
    }
    
    return "0x" + proposal.toString(16).toString().toUpperCase() + ","


}


for (let i = 0; i < buf.length; i++) {
    buf2 += getDoubleCharacter(buf[i])
}

buf2 = buf2.slice(0, -1)

fs.writeFile(`${outputFile}.txt`, buf2, "binary", (err) => console.log("err", err))