module.exports = function(grunt) {
    grunt.initConfig({

        /////////////////////////////////////////////////////
        // compile less files
        /////////////////////////////////////////////////////
        less: {
            options: {
                paths: ["./app/less"],
                ieCompat: false
            },
            dist: {
                files: [
                    {
                        expand: true,
                        src: '**/*.less',
                        dest: 'app/css',
                        cwd: 'app/less/',
                        ext: ".css"
                    },
                    {
                        expand: true,
                        src: '**/*.less',
                        dest: 'app/pages/',
                        cwd: 'app/pages/',
                        ext: '.css'
                    },
                    {
                        expand: true,
                        src: '**/*.less',
                        dest: 'plugins/',
                        cwd: 'plugins/',
                        ext: '.css'
                    }
                ]
            }

        },
        /////////////////////////////////////////////////////
        // uglify js files, not used yet
        /////////////////////////////////////////////////////
        uglify: {
            options: {
                screwIE8: true,
                banner: '/*! precious simulator <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {}
            }
        },
        /////////////////////////////////////////////////////
        // copy all relevant bootstrap files
        /////////////////////////////////////////////////////
        copy: {
            dist: {
                files: [
                    {expand: true, cwd: 'node_modules/bootstrap/dist/css/', src: ['*.min.css'], dest: 'app/lib/bootstrap/css/'},
                    {expand: true, cwd: 'node_modules/bootstrap/dist/fonts/', src: ['*'], dest: 'app/lib/bootstrap/fonts/'},
                    {expand: true, cwd: 'node_modules/bootstrap/dist/js/', src: ['*.min.js'], dest: 'app/lib/bootstrap/js/'},
                    {expand: true, cwd: 'node_modules/jquery/dist/', src: ['*.min.js'], dest: 'app/lib/js/'}
                ]
            }
        },
        /////////////////////////////////////////////////////
        // package electron app
        /////////////////////////////////////////////////////
        electron: {
            all: {
                options: {
                    arch: 'all',
                    all: true,
                    dir: "./",
                    name: "Precious Simulator",
                    ignore: "(:?(:?.*\\.)?less|(:?build|.idea)(:?/.*)?)",
                    out: "./build/",
                    overwrite: true,
                    icon: "./resources/ico/precious_diamant_256.ico"
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-electron');

    grunt.registerTask("compile", ["less", "copy", "uglify"]);
    grunt.registerTask("build", ["compile", "electron"]);
    grunt.registerTask('default', ['build']);
};
