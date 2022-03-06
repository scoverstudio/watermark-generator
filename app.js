const Jimp = require("jimp");
const inquirer = require("inquirer");
const fs = require("fs");

const imgPath = "./img/";

const addTextWatermarkToImage = async (inputFile, outputFile, text) => {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
  } catch (error) {
    console.log("Something went wrong... Try again!");
  }
};

const addImageWatermarkToImage = async (
  inputFile,
  outputFile,
  watermarkFile
) => {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
  } catch (error) {
    console.log("Something went wrong... Try again!");
  }
};

const changeBrightness = async (inputFile, outputFile) => {
  const image = await Jimp.read(inputFile);
  image.brightness(0.4).writeAsync(outputFile);
};

const changeContrast = async (inputFile, outputFile) => {
  const image = await Jimp.read(inputFile);
  image.contrast(0.4).writeAsync(outputFile);
};

const changeToBW = async (inputFile, outputFile) => {
  const image = await Jimp.read(inputFile);
  image.contrast(1).grayscale().writeAsync(outputFile);
};
const invertFile = async (inputFile, outputFile) => {
  const image = await Jimp.read(inputFile);
  image.invert().writeAsync(outputFile);
};

const startApp = async () => {
  const answer = await inquirer.prompt([
    {
      name: "start",
      message:
        'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: "confirm",
    },
  ]);

  if (!answer.start) process.exit();

  const prepareOutputFilename = (filename, editted) => {
    const [name, ext] = filename.split(".");
    if (editted) {
      return `eddited-${name}.${ext}`;
    } else return `${name}-with-watermark.${ext}`;
  };

  const options = await inquirer.prompt([
    {
      name: "inputImage",
      type: "input",
      message: "What file do you want to mark?",
      default: "test.jpg",
    },
    {
      name: "changeStyle",
      message: "Do you want to edit your file?",
      type: "confirm",
    },
  ]);

  if (fs.existsSync(imgPath + options.inputImage)) {
    if (options.changeStyle) {
      const styles = await inquirer.prompt([
        {
          name: "edit",
          type: "list",
          choices: [
            "make image brighter",
            "increase contrast",
            "make image b&w",
            "invert image",
          ],
        },
      ]);

      if (styles.edit === "make image brighter") {
        changeBrightness(
          imgPath + options.inputImage,
          imgPath + prepareOutputFilename(options.inputImage, true)
        );
      }
      if (styles.edit === "increase contrast") {
        changeContrast(
          imgPath + options.inputImage,
          imgPath + prepareOutputFilename(options.inputImage, true)
        );
      }
      if (styles.edit === "make image b&w") {
        changeToBW(
          imgPath + options.inputImage,
          imgPath + prepareOutputFilename(options.inputImage, true)
        );
      }
      if (styles.edit === "invert image") {
        invertFile(
          imgPath + options.inputImage,
          imgPath + prepareOutputFilename(options.inputImage, true)
        );
      }
      options.inputImage = prepareOutputFilename(options.inputImage, true);
    }
  } else {
    console.log("Something went wrong... Try again (check if file exists)");
    process.exit();
  }

  const watermarkType = await inquirer.prompt([
    {
      name: "watermarkType",
      type: "list",
      choices: ["Text watermark", "Image watermark"],
    },
  ]);

  if (watermarkType.watermarkType === "Text watermark") {
    const text = await inquirer.prompt([
      {
        name: "value",
        type: "input",
        message: "Type your watermark text:",
      },
    ]);
    watermarkType.watermarkText = text.value;

    addTextWatermarkToImage(
      imgPath + options.inputImage,
      imgPath + prepareOutputFilename(options.inputImage),
      watermarkType.watermarkText
    );
    fs.unlinkSync(imgPath + options.inputImage);
    console.log(
      `Text watermark '${watermarkType.watermarkText}' was appended to file!`
    );
  } else {
    const image = await inquirer.prompt([
      {
        name: "filename",
        type: "input",
        message: "Type your watermark name:",
        default: "logo.png",
      },
    ]);
    watermarkType.watermarkImage = image.filename;

    if (fs.existsSync(imgPath + watermarkType.watermarkImage)) {
      addImageWatermarkToImage(
        imgPath + options.inputImage,
        imgPath + prepareOutputFilename(options.inputImage),
        imgPath + watermarkType.watermarkImage
      );
      fs.unlinkSync(imgPath + options.inputImage);
      console.log(`Image watermark was appended to file!`);
    } else {
      console.log(
        "Something went wrong... Try again (check if watermark exists)"
      );
      startApp();
    }
  }
};

startApp();
