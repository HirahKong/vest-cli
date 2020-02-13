var fs = require('fs'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    argv = require('yargs').argv,
    print = require('../../utils/print'),
    logger = require('../../utils/logger'),
    shell = require('shelljs');

var config = {
    name: 'sync',
    explain: 'sync vest project config',
    command: 'vest sync',
    options: [{
        keys: ['-h', '--help'],
        describe: 'read update.'
    }]
}

function helpTitle() {
    print.title(config)
}

function helpCommand() {
    print.command(config)
}

function syncHandler(params) {

    let vestCompile = require(path.resolve(process.cwd(), './config/vest.compile.js'))
    let vestModules = require(path.resolve(process.cwd(), './config/vest.modules.js'))
    let vestApp = require(path.resolve(process.cwd(), './config/vest.app.js'))
    let propertiesPath = path.resolve(process.cwd(), './VestAppWrapper/gradle.properties')
    let gradlePath = path.resolve(process.cwd(), './VestAppWrapper/app/build.gradle')

    let compileModules = vestCompile.modules;
    let compileThirdSdk = vestCompile.thirdSdk;
    let propertiesContent = fs.readFileSync(propertiesPath, 'utf8')
    let gradleContent = fs.readFileSync(gradlePath, 'utf8')

    let thirdSdkPrefix = '#start'
    let thirdSdkEndfix = '#end'
    let moduleCompilePrefix = '        //====================Modules Compile Start===================='
    let moduleCompileEndfix = '        //====================Modules Compile End===================='

    //====================Third SDK====================
    let thirdSdkArr = new Array();
    thirdSdkArr.push(thirdSdkPrefix)
    thirdSdkArr.push("APPLICATION_ID=" + vestApp.appName)
    thirdSdkArr.push("APP_NAME=" + vestApp.applicationId)
    thirdSdkArr.push("VERSION_NAME=" + vestApp.version)

    Object.keys(compileThirdSdk).forEach(function (key) {
        thirdSdkArr.push(key + "=" + compileThirdSdk[key])
    });

    thirdSdkArr.push(thirdSdkEndfix)
    let thirdSdkStr = thirdSdkArr.join("\n");

    logger.sep();
    logger.success('compile done! start to write.'.green);
    logger.log('write -----> gradle.properties');

    let sdkPreIndex = propertiesContent.lastIndexOf(thirdSdkPrefix)
    let sdkEndIndex = propertiesContent.lastIndexOf(thirdSdkEndfix) + thirdSdkPrefix.length - 1;
    let sdkEndStr = (propertiesContent.slice(sdkEndIndex, propertiesContent.length).length !== 0 ? "\n" + propertiesContent.slice(sdkEndIndex, propertiesContent.length) : "")

    fs.writeFileSync(propertiesPath, propertiesContent.slice(0, sdkPreIndex).concat(thirdSdkStr, sdkEndStr), 'utf8');

    //====================Modules Compile====================

    let moduleCompileArr = new Array();
    moduleCompileArr.push(moduleCompilePrefix)
    compileModules.forEach(function (moduleCompile) {
        let info =
            `        api('${moduleCompile}') {
            transitive = true
        }`
        moduleCompileArr.push(info)
    })
    moduleCompileArr.push(moduleCompileEndfix)

    let moduleCompileStr = moduleCompileArr.join("\n");
    logger.log('write -----> gradle.properties');
    let modulesCompilePreIndex = gradleContent.lastIndexOf(moduleCompilePrefix)
    let modulesCompileEndIndex = gradleContent.lastIndexOf(moduleCompileEndfix) + moduleCompilePrefix.length - 1;
    let modulesCompileEndStr = (gradleContent.slice(modulesCompileEndIndex, gradleContent.length).length !== 0 ? "\n" + gradleContent.slice(modulesCompileEndIndex, gradleContent.length) : "")

    fs.writeFileSync(gradlePath, gradleContent.slice(0, modulesCompilePreIndex).concat(moduleCompileStr, modulesCompileEndStr), 'utf8');

    //====================Modules Json File====================
    const modulesCompileTarget = path.resolve(process.cwd(), './VestAppWrapper/app/src/main/assets/');
    jsonfile.writeFileSync(path.resolve(modulesCompileTarget, "modules.json"), vestModules);
    logger.log('write -----> modules.json');

    //====================Move Icon====================

    var _source = path.resolve(process.cwd(), './config/icon/');
    var _assetspath = path.resolve(process.cwd(), './VestAppWrapper/app/src/main/assets/');

    shell.cp('-r', _source, _assetspath);
    logger.log('write -----> icon directory');

    //==================== Move ic_launcher ====================
    var _ic_launcher_source = path.resolve(process.cwd(), './config/image/ic_launcher.png');
    var _ic_launcher_assetspath = path.resolve(process.cwd(), './VestAppWrapper/app/src/main/res/mipmap-xhdpi/ic_launcher.png');

    shell.cp('-r', _ic_launcher_source, _ic_launcher_assetspath);
    logger.log('write -----> ic_launcher icon');

     //==================== Move ic_splash ====================
    var ic_splash_source = path.resolve(process.cwd(), './config/image/ic_splash.png');
    var ic_splash_assetspath = path.resolve(process.cwd(), './VestAppWrapper/app/src/main/res/drawable-xhdpi/ic_splash.png');

    shell.cp('-r', ic_splash_source, ic_splash_assetspath);
    logger.log('write -----> ic_splash icon');

    logger.sep();
    logger.success('sync success!'.green);
}


function run() {
    if (argv.h || argv.help) {
        helpCommand()
    }
    syncHandler()
}

module.exports = {
    run: run,
    config: config,
    helpTitle: helpTitle,
    helpCommand: helpCommand
}