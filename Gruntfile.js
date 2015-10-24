/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                src: ["src/**/*.ts"],
                options: {
                    declaration: true
                },
                out: 'out/boink.js'
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['src/**/*.ts']
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: {
                    'out/boink.min.js': ['out/boink.js']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    grunt.registerTask('default', ['tslint', 'ts', 'uglify']);
};