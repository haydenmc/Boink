/// <binding AfterBuild='default' />
/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default : {
                src: ["Scripts/Ts/**/*.ts"],
                out: 'wwwroot/application.js'
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['Scripts/Ts/**/*.ts']
            }
        },
        includes: {
            files: {
                src: ['Templates/index.html'], // Source files 
                dest: 'wwwroot', // Destination directory 
                flatten: true,
                cwd: '.'
            }
        },
        copy: {
            main: {
                src: 'node_modules/webcomponents.js/webcomponents.min.js',
                dest: 'wwwroot/webcomponents.js'
            },
        },
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-includes');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('default', ['tslint', 'ts', 'includes', 'copy']);
};