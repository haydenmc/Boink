/// <binding AfterBuild='default' />
/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            base: {
                src: ['Scripts/Ts/**/*.ts'],
                dest: 'wwwroot/application.js',
                options: {
                    module: 'amd', //or commonjs 
                    target: 'es5', //or es3 
                    rootDir: 'Scripts/Ts',
                    sourceMap: false,
                    declaration: false,
                    references: [
                        "Scripts/Typings/**/*.d.ts"
                    ]
                }
            }
        },
        includes: {
            files: {
                src: ['Templates/index.html'], // Source files 
                dest: 'wwwroot', // Destination directory 
                flatten: true,
                cwd: '.'
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-includes');

    grunt.registerTask('default', ['typescript', 'includes']);
};