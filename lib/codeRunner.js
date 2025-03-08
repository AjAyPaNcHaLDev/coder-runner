// codeRunner.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { addCleanupTask } = require("./cleanupQueue");

// Directory where temporary code files will be stored.
const CODE_DIR = path.join(__dirname, "temp_codes");
if (!fs.existsSync(CODE_DIR)) {
  console.debug("[DEBUG] Creating code directory:", CODE_DIR);
  fs.mkdirSync(CODE_DIR);
}

// Check if Docker is installed; if not, attempt to install it.
// Note: This requires the process to have sufficient privileges.
const checkAndInstallDocker = () => {
  console.debug("[DEBUG] Checking if Docker is installed...");
  exec("docker --version", (error, stdout, stderr) => {
    if (error) {
      console.debug("[DEBUG] Docker is not installed. Attempting to install Docker...");
      exec("sudo apt-get update && sudo apt-get install -y docker.io", (installErr, installStdout, installStderr) => {
        if (installErr) {
          console.error("[DEBUG] Failed to install Docker:", installStderr || installErr.message);
        } else {
          console.debug("[DEBUG] Docker installed successfully:", installStdout);
        }
      });
    } else {
      console.debug("[DEBUG] Docker is already installed:", stdout);
    }
  });
};

checkAndInstallDocker();

const runCode = (language, code, res) => {
  console.debug("[DEBUG] Received execution request for language:", language);
  // Generate a unique identifier for file isolation.
  const uniqueId = Date.now() + "-" + Math.floor(Math.random() * 1000);
  console.debug("[DEBUG] Generated unique ID:", uniqueId);
  let filePath;
  let command;

  if (language === "java") {
    // For Java, create a dedicated directory because the file must be named Main.java.
    const javaDir = path.join(CODE_DIR, `java_${uniqueId}`);
    console.debug("[DEBUG] Creating Java directory:", javaDir);
    fs.mkdirSync(javaDir);
    filePath = path.join(javaDir, "Main.java");
    console.debug("[DEBUG] Writing Java code to file:", filePath);
    fs.writeFileSync(filePath, code);
    // Docker command uses the openjdk image with /code mapped to the javaDir.
    command = `docker run --rm -v ${javaDir}:/code openjdk:11 bash -c "javac /code/Main.java && java -cp /code Main"`;
    console.debug("[DEBUG] Docker command for Java:", command);

    exec(command, (error, stdout, stderr) => {
      const output = error || stderr ? (stderr || error.message) : stdout;
      console.debug("[DEBUG] Java execution output:", output);
      res.json({ output });
      // Schedule deletion of the entire Java directory.
      addCleanupTask({ type: "dir", path: javaDir });
    });
    return;
  } else {
    // For other languages, determine the file name based on language.
    let fileName;
    switch (language) {
      case "javascript":
        fileName = `script_${uniqueId}.js`;
        break;
      case "python":
        fileName = `script_${uniqueId}.py`;
        break;
      case "c":
        fileName = `program_${uniqueId}.c`;
        break;
      case "c++":
        fileName = `program_${uniqueId}.cpp`;
        break;
      default:
        fileName = `script_${uniqueId}.txt`;
    }
    filePath = path.join(CODE_DIR, fileName);
    console.debug(`[DEBUG] Writing ${language} code to file:`, filePath);
    fs.writeFileSync(filePath, code);
    
    // Build the Docker run command based on the language.
    switch (language) {
      case "javascript":
        command = `docker run --rm -v ${filePath}:/code/${fileName} node:14 node /code/${fileName}`;
        break;
      case "python":
        command = `docker run --rm -v ${filePath}:/code/${fileName} python:3 python /code/${fileName}`;
        break;
      case "c":
        command = `docker run --rm -v ${filePath}:/code/${fileName} gcc bash -c "gcc /code/${fileName} -o /code/program && /code/program"`;
        break;
      case "c++":
        command = `docker run --rm -v ${filePath}:/code/${fileName} gcc bash -c "g++ /code/${fileName} -o /code/program && /code/program"`;
        break;
      default:
        console.debug("[DEBUG] Unsupported language:", language);
        return res.json({ error: "Unsupported language" });
    }
    console.debug(`[DEBUG] Docker command for ${language}:`, command);
  }

  exec(command, (error, stdout, stderr) => {
    const output = error || stderr ? (stderr || error.message) : stdout;
    console.debug("[DEBUG] Execution output:", output);
    res.json({ output });
    // Schedule deletion of the code file.
    addCleanupTask({ type: "file", path: filePath });
  });
};

module.exports = {
  runCode,
};
