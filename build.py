# Copyright (c) 2012 Turbulenz Limited

import os
import sys
import glob

from platform import system, machine
from subprocess import Popen, PIPE, STDOUT
from simplejson import loads as json_loads, dump as json_dump, JSONDecodeError
import yaml
from hashlib import sha1
import base64
from shutil import copyfile, rmtree
from optparse import OptionParser
from distutils.version import StrictVersion

from genmapping import gen_mapping

BUILDVERSION = '0.9.1'

ENGINEVERSION = '0.20.0'
SDKVERSION = '0.20.0'

#User defined variables: Only set if different from default

#USER_SDK_PATH = "C:\\Turbulenz\\SDK\\0.19.0"
#USER_ENV_PATH = USER_SDK_PATH + "\env"
USER_APP_JSLIB_PATH = os.path.join('scripts', 'turbulenz')


def removeDir(path, options):
    if os.path.isdir(path):
        rmtree(path)

def check_path_py_tools(env, options):

    path = None
    env_name = 'PYTOOLS_ROOT'
    try:
        env_path = env['ENV_PATH']
        turbulenz_os = env['TURBULENZ_OS']
    except KeyError as e:
        print "[Error] Missing required env: %s " % str(e)
        return (env_name, None)

    if turbulenz_os == 'macox' or turbulenz_os == 'linux64' or turbulenz_os or 'linux32':
        path = os.path.join(env_path, 'bin')
    elif turbulenz_os == 'win32':
        path = os.path.join(env_path, 'Scripts')
    else:
        print "[Error] Platform not recognised. Cannot configure build."
        return (env_name, None)

    if os.path.exists(path):
        env[env_name] = path
    else:
        print "[Warning] Can't find optional %s path (Not set)" % (env_name)
    return (env_name, path)


def check_py_tool(env_name, tool_name, env, options, exp_version_str=None,
                  default_arg=None):

    if env_name is None or env_name == '':
        print "[Error] No env_name specified"
        return (None, None)

    if options.verbose:
        print "[Info] Checking: " + tool_name
    tool = None

    try:
        turbulenz_os = env['TURBULENZ_OS']
    except KeyError as e:
        print "[Error] Missing required env: %s " % str(e)
        return (env_name, None)

    if turbulenz_os == 'macosx' or turbulenz_os == 'linux64' or turbulenz_os == 'linux32':
        tool = tool_name
    elif turbulenz_os == 'win32':
        tool = tool_name
    else:
        print "[Error] Platform not recognised. Cannot configure build."
        return (env_name, None)

    print "turbulenz_os: %s" % turbulenz_os
    print "TOOL: %s" % tool

    # Check tool runs
    if options.verbose:
        print "[Info] Calling tool: " + tool
    args = [tool]
    if default_arg:
        args.append(default_arg)
    try:
        result = exec_command(args,
                              verbose=options.verbose,
                              console=options.verbose)
    except CalledProcessError:
        print "[Warning] Failed to run tool as: "
        print args
        print "[Warning] You're environment may not be setup correctly"

        # Attempt to use tools_root
        if options.verbose:
            print "[Info] Attempting to look in the python tools root"
        try:
            pytools_root = env['PYTOOLS_ROOT']
        except KeyError:
            print "[Error] Missing required env: %s " % str(e)
            return (env_name, None)

        tool = os.path.join(pytools_root, tool_name + '.py')
        if not os.path.exists(tool):
            print "[Error] Tool doesn't exist: %s" % tool
            if options.verbose:
                print "[Info] Path: %s" % tool
        args = [tool]
        if default_arg:
            args.append(default_arg)
        try:
            result = exec_command(args, verbose=options.verbose, console=options.verbose)
        except CalledProcessError:
            print "[Error] Failed to run tool as: "
            print args
            print "[Error] Tool not found in standard locations"
            return (env_name, None)

    # Tool runs, check version
    env[env_name] = tool

    if options.verbose:
        print "[Info] Checking version"
    # Check the version info matches
    if exp_version_str:
        args = [tool, '--version']
        try:
            result = exec_command(args, verbose=options.verbose, console=options.verbose)
            if result != exp_version_str:
                print "[Error] Tool version returned: %s" % result
                return False

        except CalledProcessError:
            print "[Error] Tool failed to print version"
            return False

    return (env_name, tool)

def check_cgfx_tool(env, options):

    env_name = 'CGFX2JSON'
    try:
        tools_root = env['TOOLS_ROOT']
        turbulenz_os =  env['TURBULENZ_OS']
        exe = env['EXE_EXT_OS']
    except KeyError as e:
        print "[Error] Missing required env: %s " % str(e)
        return (env_name, None)

    tool = os.path.join(tools_root, 'bin', turbulenz_os, 'cgfx2json') + exe
    if not os.path.exists(tool):
        print "[Error] Can't find the cgfx2json tool: %s" % tool
        return (env_name, None)

    args = [tool]
    try:
        result = exec_command(args, verbose=options.verbose, console=options.verbose)
    except CalledProcessError:
        print "[Error] Failed to run tool cgfx2json: "
        print args
        return (env_name, None)
    if options.verbose:
        print "Result: %s" % str(result)

    env[env_name] = tool
    return (env_name, tool)


def configure(env, options):

    print "Configuring..."
    app_root = os.getcwd()
    exe = ''
    turbulenz_os = ''
    result = False

    system_name = system()
    machine_name = machine()
    if system_name == 'Linux':
        if machine_name == 'x86_64':
            turbulenz_os = 'linux64'
        else:
            turbulenz_os = 'linux32'
    elif system_name == 'Windows':
        turbulenz_os = 'win32'
        exe = '.exe'
    elif system_name == 'Darwin':
        turbulenz_os = 'macosx'

    if turbulenz_os == '':
        print "[Error] Build not supported on this platform"

    env['TURBULENZ_OS'] = turbulenz_os
    env['EXE_EXT_OS'] = exe


    try:
        engine_version_minor = StrictVersion('.'.join(ENGINEVERSION.split('.')[0:2]))
        engine_version = StrictVersion(ENGINEVERSION)
        env['ENGINE_VERSION_STR'] = ENGINEVERSION
        env['ENGINE_VERSION'] = engine_version
    except ValueError:
        print "[Error]: Version of Engine not recognised: %s" % ENGINEVERSION
        return False

    try:
        sdk_version_minor = StrictVersion('.'.join(SDKVERSION.split('.')[0:2]))
        sdk_version = StrictVersion(SDKVERSION)
        env['SDK_VERSION_STR'] = SDKVERSION
        env['SDK_VERSION'] = sdk_version
    except ValueError:
        print "[Error]: Version of SDK not recognised: %s" % SDKVERSION
        return False

    if engine_version != sdk_version:
        if options.verbose:
            print "[Warning]: Target engine and SDK version don't match. Engine: %s, SDK: %s" % (engine_version, sdk_version)

    if engine_version_minor != sdk_version_minor:
        print "[Error]: Target engine and SDK minor versions are not compatible. Engine: %s, SDK: %s" % (engine_version_minor, sdk_version_minor)
        return False

    if 'USER_SDK_PATH' in globals():
        sdk_root = os.path.expanduser(USER_SDK_PATH)
    else:
        if turbulenz_os == 'win32':
            sdk_root = os.path.expanduser(os.path.join('C:\\', 'Turbulenz', 'SDK', SDKVERSION))
        elif turbulenz_os == 'macosx' or turbulenz_os == 'linux32' or turbulenz_os == 'linux64':
            sdk_root = os.path.expanduser(os.path.join('~/', 'Turbulenz', 'SDK', SDKVERSION))
        else:
            print "[Error] Platform not recognised. Cannot configure build."
            return False

    if not os.path.exists(sdk_root):
        print "Can't find the SDK specified: %s" % sdk_root
        print "If you are using a non-standard SDK path, set it in this file using USER_SDK_PATH"
        return False

    # Check expected env
    env_path = os.environ['VIRTUAL_ENV']

    if 'USER_ENV_PATH' in globals():
        env_path_expt = USER_ENV_PATH
    else:
        env_path_expt = os.path.join(sdk_root, 'env')

    if env_path.lower() != env_path_expt.lower():
        print "[Error] The environment you are running from is not the same as expected for the target SDK"
        print "Expected: %s, Actual: %s" % (env_path_expt, env_path)
        print "You may need to activate a different SDK environment."
        print "If you are using a different environment set it in this file using USER_ENV_PATH"
        return False

    env['ENV_PATH'] = env_path

    env['APP_ROOT'] = app_root
    env['APP_PAIR'] = (app_root + ',./')
    env['SDK_ROOT'] = sdk_root

    tools_root = os.path.join(sdk_root, 'tools')
    env['TOOLS_ROOT'] = tools_root

    (_, pytools_root) = check_path_py_tools(env, options)
    if pytools_root is None:
        print "[Warning] Path pytools_root has not been set (optional)"

    # Check for the existence of tools
    if sdk_version < StrictVersion('0.19.0'):
        required = dict(JS2TZJS=True, \
                        HTML2TZHTML=True, \
                        CGFX2JSON=False)
    else:
        required = dict(MAKETZJS=True,   \
                        MAKEHTML=True,   \
                        CGFX2JSON=False \
                        )

    (DAE2JSON, dae2json) = check_py_tool('DAE2JSON', 'dae2json', env, options)
    if dae2json is None:
        raise Exception("can't find dae2json tool")
    print("dae2json: %s" % env['DAE2JSON'])
    
    (BMFONT2JSON, bmfont2json) = check_py_tool('BMFONT2JSON', 'bmfont2json', env, options)
    if bmfont2json is None:
        raise Exception("can't find bmfont2json tool")
    print("bmfont2json: %s" % env['BMFONT2JSON'])

    for (env_name, req) in required.iteritems():
        if env_name == 'JS2TZJS':
                (JS2TZJS, js2tzjs) = check_py_tool('JS2TZJS', 'js2tzjs', env, options)
                if js2tzjs is None:
                        if req:
                                print "[Error] Couldn't find js2tzjs tool (required)"
                                return False
                        else:
                                print "[Warning] Couldn't find js2tzjs tool (optional)"
        if env_name == 'HTML2TZHTML':
                (HTML2TZHTML, html2tzhtml) = check_py_tool('HTML2TZHTML','html2tzhtml', env, options)
                if html2tzhtml is None:
                        if req:
                                print "[Error] Couldn't find html2tzhtml tool (required)"
                                return False
                        else:
                                print "[Warning] Couldn't find html2tzhtml tool (optional)"
        if env_name == 'MAKETZJS':
                (MAKETZJS, maketzjs) = check_py_tool('MAKETZJS', 'maketzjs', env, options, default_arg='--version')
                if maketzjs is None:
                        if req:
                                print "[Error] Couldn't find maketzjs tool (required)"
                                return False
                        else:
                                print "[Warning] Couldn't find maketzjs tool (optional)"
        if env_name == 'MAKEHTML':
                (MAKEHTML, makehtml) = check_py_tool('MAKEHTML', 'makehtml', env, options, default_arg='--version')
                if makehtml is None:
                        if req:
                                print "[Error] Couldn't find makehtml tool (required)"
                                return False
                        else:
                                print "[Warning] Couldn't find makehtml tool (optional)"

        if env_name == 'CGFX2JSON':
                (CGFX2JSON, cgfx2json) = check_cgfx_tool(env, options)
                if cgfx2json is None:
                        if req:
                                print "[Error] Couldn't find cgfx2json tool (required)"
                                return False
                        else:
                                print "[Warning] Couldn't find cgfx2json tool (optional)"

    env['APP_STATICMAX'] = os.path.join(app_root, 'staticmax')
    env['APP_TEMPLATES'] = os.path.join(app_root, 'templates')
    env['APP_SHADERS'] = os.path.join(app_root, 'assets', 'shaders')
    env['APP_MATERIALS'] = os.path.join(app_root, 'assets', 'materials')
    env['APP_MODELS'] = os.path.join(app_root, 'assets', 'models')
    env['APP_TEXTURES'] = os.path.join(app_root, 'assets', 'textures')
    env['APP_SOUNDS'] = os.path.join(app_root, 'assets', 'sounds')
    env['APP_FONTS'] = os.path.join(app_root, 'assets', 'fonts')
    env['APP_SCRIPTS'] = os.path.join(app_root, 'scripts')

    if 'USER_APP_JSLIB_PATH' in globals():
        env['APP_JSLIB'] = os.path.join(app_root, USER_APP_JSLIB_PATH)
    else:
        env['APP_JSLIB'] = os.path.join(app_root)

    return True

# pylint: disable=W0231
class CalledProcessError(Exception):
    def __init__(self, retcode, cmd, output=None):
        self.retcode = retcode
        self.cmd = cmd
        self.output = output
    def __str__(self):
        return "Command '%s' returned non-zero exit status %d" % (self.cmd, self.retcode)
# pylint: enable=W0231

def exec_command(command, cwd=None, env=None, verbose=True, console=False,
                 ignore=False, shell=True, wait=True):

    if isinstance(command, list):
        command_list = command
        command_string = ' '.join(command)
    else:
        command_list = command.split()
        command_string = command

    print "exec_command: %s" % command_string

    if verbose:
        print('Executing: %s' % command_string)

    if wait:
        if console:
            process = Popen(command_string, stderr=STDOUT, cwd=cwd, shell=shell)
        else:
            process = Popen(command_string, stdout=PIPE, stderr=STDOUT, cwd=cwd, shell=shell)

        output, _ = process.communicate()
        output = str(output)
        retcode = process.poll()
        if retcode:
            if ignore is False:
                raise CalledProcessError(retcode, command_list, output=output)

        if output is not None:
            output = output.rstrip()

        return output
    else:
        if system() == 'Windows':
            detached_process = 0x00000008
            Popen(command_list, creationflags=detached_process, cwd=cwd, shell=shell)
        else:
            Popen(command_list, stdout=PIPE, stderr=STDOUT, cwd=cwd, shell=shell)

def run_html_dev(task):
    src = task['inputs'][0]
    inc = task['inputs'][1]
    tgt = task['outputs'][0]
    env = task['env']
    args = ['python', '-m', env['HTML2TZHTML'],
            '-i', src,
            '-o', tgt,
            '-j', inc,
            '-t', env['APP_TEMPLATES']]
    return exec_command(args, verbose=task['options'].verbose, console=True)

def run_html_rel(task):
    src = task['inputs'][0]
    tgt = task['outputs'][0]
    env = task['env']
    tzjs = (os.path.splitext(src)[0] + '.tzjs')
    return exec_command(['python', '-m', env['HTML2TZHTML'],
                               '-i', src,
                               '-o', tgt,
                               '-z', tzjs,
                               '-t', env['APP_TEMPLATES']], verbose=task['options'].verbose, console=True)

def run_makehtml(env, options, input=None, mode=None, output=None, templates=[], code=None, template=None):
        try:
                makehtml = env['MAKEHTML']
        except KeyError as e:
                print "[Error] Missing required env: %s " % str(e)
                raise CalledProcessError(1, 'makehtml')

        args = [makehtml]
        if mode is not None:
                args.append('--mode')
                args.append(mode)
        if output is not None:
                args.append('-o')
                args.append(output)
        for t in templates:
                args.append('-t')
                args.append(t)
        if code is not None:
                if mode is not None:
                        if mode == 'plugin' or mode == 'canvas':
                                args.append('--code')
                                args.append(code)
                        else:
                                print "[Error] Code was specified, with an unexpected mode: %s" % mode
                                raise CalledProcessError(1, 'makehtml')
                else:
                        print "[Error] Code was specified without a mode"
                        raise CalledProcessError(1, 'makehtml')
        if input is not None:
                args.append(input)
        if template is not None:
                args.append(template)
        return exec_command(args, verbose=options.verbose, console=True, shell=True)

def run_maketzjs(env, options, input=None, mode=None, output=None, templates=[]):
        try:
                maketzjs = env['MAKETZJS']
        except KeyError as e:
                print "[Error] Missing required env: %s " % str(e)
                raise CalledProcessError(1, 'maketzjs')

        #TODO: version check
        args = [maketzjs]
        if mode is not None:
                args.append('--mode')
                args.append(mode)
        if output is not None:
                args.append('-o')
                args.append(output)
        for t in templates:
                args.append('-t')
                args.append(t)
        if input is not None:
                args.append(input)

        return exec_command(args, verbose=options.verbose, console=True)

def run_js2tzjs(task):
    src = task['inputs'][0]
    tgt = task['outputs'][0]
    env = task['env']
    args = [env['JS2TZJS'],
            '-i', src,
            '-o', tgt,
            '-t', env['APP_TEMPLATES'],
            '-I', env['SDK_ROOT'],
            '-I', env['APP_ROOT'],
            '-z',
            '--ev', env['ENGINE_VERSION_STR']]

    return exec_command(args, verbose=task['options'].verbose, console=True)

def run_js2tzjs_jsinc(task):
    src = task['inputs'][0]
    tgt = task['outputs'][0]
    env = task['env']
    args = [env['JS2TZJS'],
            '-i', src,
            '-o', tgt,
            '-t', env['APP_TEMPLATES'],
            '-I', env['SDK_ROOT'],
            '-I', env['APP_ROOT'],
            '--ev', env['ENGINE_VERSION_STR']]

    return exec_command(args, verbose=task['options'].verbose, console=True)

def run_cgfx2json(env, options, input=None, output=None):
        try:
                cgfx2json = env['CGFX2JSON']
        except KeyError as e:
                print "[Error] Missing required env: %s " % str(e)
                raise CalledProcessError(1, 'cgfx2json')

        #TODO: version check
        args = [cgfx2json]
        if input is not None:
                args.append('-i')
                args.append(input)
        if output is not None:
                args.append('-o')
                args.append(output)
        return exec_command(args, verbose=options.verbose, console=True)

def clean(env, options):

    result = 0

    try:
        # Clean staticmax
        removeDir(env['APP_STATICMAX'], options)

        # Clean mapping_table
        mapping_path = os.path.join(env['APP_ROOT'], 'mapping_table.json')
        if os.path.exists(mapping_path):
                os.remove(mapping_path)

        # Aggressive root level cleaning
        for f in os.listdir(env['APP_ROOT']):
            (filename, ext) = os.path.splitext(f)

            # Also cleans previous SDK content e.g. .jsinc

            # Clean .jsinc
            if ext == '.jsinc':
                os.remove(f)
            # Clean .tzjs
            if ext == '.tzjs':
                os.remove(f)
            # Clean .html
            if ext == '.html':
                os.remove(f)
            if ext == '.js':
                #Only remove canvas js files, might have js in root folder
                (appname, target) = os.path.splitext(filename)
                if target == '.canvas':
                    os.remove(f)
                else:
                    if options.verbose:
                        print '[Warning] target %s unknown, ignoring. Not cleaned: %s' % (target, f)
    except OSError as e:
        print 'Failed to remove: %s' % str(e)
        result = 1
    return result

############################################################

def do_build_code(filepath, env, options):

    builderror = 0
    templates=[env['APP_ROOT'], env['APP_TEMPLATES'], env['APP_JSLIB']]

    (filename, ext) = os.path.splitext(filepath)

    if ext == '.html':
        (appname, buildtype) = os.path.splitext(filename)

        html_templates = [ t + "/" + appname + ".html" for t in templates ]
        html_templates = [ os.path.split(t)[1] \
                               for t in html_templates if os.path.exists(t) ]
        # print "HTML templates: %s" % html_templates
        # print "buildtype: %s" % buildtype

        if buildtype is not None:
            try:
                (appname, target) = os.path.splitext(appname)
                if buildtype == '.development':
                    if options.verbose:
                        print "[Warning] 'development' should now be 'debug' and has not been built. Change the name of the destination file"
                else:
                    if target == '.canvas':
                        if buildtype == '.debug':
                                run_makehtml(env, options,
                                        input=(appname + '.js'),
                                        mode='canvas-debug',
                                        output=filepath,
                                        templates=templates,
                                        template=" ".join(html_templates))
                        elif buildtype == '.release':
                                run_makehtml(env, options,
                                        input=(appname + '.js'),
                                        mode='canvas',
                                        output=filepath,
                                        templates=templates,
                                        code=(appname + target + '.js'),
                                        template=" ".join(html_templates))
                        else:
                            if options.verbose:
                                print "[Warning] Build type not recognised: %s" % buildtype
            except CalledProcessError as e:
                builderror = 1
                print '[ERROR] Command failed: ' + str(e)

    elif ext == '.tzjs':
        try:
            if env['SDK_VERSION'] < StrictVersion('0.19.0'):
                run_js2tzjs({
                    'inputs': [filename + '.js'],
                    'outputs': [filepath],
                    'env': env,
                    'options': options
                })
            else:
                (appname, target) = os.path.splitext(filename)
                if target == '':
                    run_maketzjs(env, options,
                            mode='plugin',
                            input=(appname + '.js'),
                            output=filepath,
                            templates=templates)
                else:
                    if options.verbose:
                        print "[Warning] Target not recognised: %s" % target
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)

    elif ext == '.js':
        try:
            if env['SDK_VERSION'] >= StrictVersion('0.19.0'):
                (appname, target) = os.path.splitext(filename)
                if target == '.canvas':
                    run_maketzjs(env, options,
                            mode='canvas',
                            input=(appname + '.js'),
                            output=filepath,
                            templates=templates)
                else:
                    if options.verbose:
                        print "[Warning] Target not recognised: %s" % target
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)

    elif ext == '.jsinc':
        try:
            run_js2tzjs_jsinc({
                'inputs': [filename + '.js'],
                'outputs': [filepath],
                'env': env,
                'options': options
            })
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)




def do_build(src, dest, env, options):

    builderror = 0
    templates=[env['APP_ROOT'], env['APP_TEMPLATES'], env['APP_JSLIB']]

    (filename, ext) = os.path.splitext(src)

    if ext == '.cgfx':
        try:
            run_cgfx2json(env, options, input=src, output=dest)
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)

    elif ext == '.dae':
        try:
            exec_command("%s -i %s -o %s" % (env['DAE2JSON'], src, dest))
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)
            
    elif ext == '.fnt':
        try:
            exec_command("%s -i %s -o %s" % (env['BMFONT2JSON'], src, dest))
        except CalledProcessError as e:
            builderror = 1
            print '[ERROR] Command failed: ' + str(e)

    else:
        copyfile(src, dest)

    return builderror

def json2yaml(source_filename, dest_filename, is_mapping_table):

    json_filename = '%s.json' % source_filename
    yaml_filename = '%s.yaml' % dest_filename

    result = 0

    json_file = None
    yaml_file = None

    try:
        json_file = open(json_filename, 'r')
        yaml_file = open(yaml_filename, 'w')
    except IOError as e:
        print str(e)
        result = 1
    else:
        json = json_file.read()
        try:
            json_dict = json_loads(json)
        except JSONDecodeError as e:
            print ('Failed to decode response for: %s' % json)
            result = 1
        else:
            if is_mapping_table:
                try:
                    mapping_version = json_dict['version']
                    if mapping_version == 1.0:
                        json_dict = json_dict['urnmapping']
                        if json_dict:
                            yaml.dump(json_dict, yaml_file, default_flow_style=False)
                        else:
                            print ('Cannot find urnmapping data')
                            result = 1
                    else:
                        print ('Mapping table version, not recognized: %s' % mapping_version)
                        result = 1
                except KeyError:
                    print 'No version information in mapping table'
                    result = 1
            else:
                yaml.dump(json_dict, yaml_file, default_flow_style=False)

    if json_file is not None:
        json_file.close()

    if yaml_file is not None:
        yaml_file.close()

    return result

def yaml2json(source_filename, dest_filename, is_mapping_table, env, options, indent=0):

    json_filename = '%s.json' % dest_filename
    yaml_filename = '%s.yaml' % source_filename

    result = 0

    json_file = None
    yaml_file = None

    try:
        json_file = open(json_filename, 'w')
        yaml_file = open(yaml_filename, 'r')
    except IOError as e:
        print str(e)
        result = 1
    else:
        yaml_data = yaml.load(yaml_file)
        if yaml_data is None:
            print ('Failed to decode response for: %s' % yaml_filename)
            result = 1
        else:
            if is_mapping_table:
                # Support for version 1.0
                yaml_dict = { 'version': 1.0 }

                staticmax_path = env['APP_STATICMAX']
                if not os.path.isdir(staticmax_path):
                    os.makedirs(staticmax_path)

                # Process assets
                for entry in yaml_data:
                    src = yaml_data[entry]
                    hash = get_staticmax_name(src)
                    if hash is not None:
                        dst = os.path.join('staticmax', hash)
                        try:
                            copyfile(src, dst)
                        except IOError as e:
                            print str(e)
                        else:
                            yaml_data[entry] = hash
                    else:
                        print "No hash available for: %s" % src

                yaml_dict['urnmapping'] = yaml_data
            else:
                yaml_dict = yaml_data
            try:
                if indent > 0:
                    json_dump(yaml_dict, json_file, indent=indent)
                else:
                    json_dump(yaml_dict, json_file)
            except TypeError as e:
                print str(e)
                result = 1

    if json_file is not None:
        json_file.close()

    if yaml_file is not None:
        yaml_file.close()

    return result

def get_target_hash(target_filepath, target_ext):
    sha1_hash = sha1()
    try:
        if target_ext == '.json':
            file = open(target_filepath, 'rt')
            temp = file.read()
            temp = temp.replace('\r\n', '\n')
            temp = temp.replace('\r', '\n')
            sha1_hash.update(temp)
            file.close()
        else: #if target_ext == '.ogg' or '.png' or '.jpg' - Resort to binary for all others
            file = open(target_filepath, 'rb')
            sha1_hash.update(file.read())
            file.close()
    except IOError as e:
        print str(e)
        return None
    else:
        return base64.urlsafe_b64encode(sha1_hash.digest()).rstrip('=')

def get_staticmax_name(output):
    (final_path, final_ext) = os.path.splitext(output)
    hash_value = get_target_hash(output, final_ext.lower())
    if hash_value is None:
        return None

    (source_path, source_ext) = os.path.splitext(final_path)
    if source_ext is None:
        # Single ext
        ext = final_ext
    else:
        ext = source_ext + final_ext
    return hash_value + ext

def find_non_ascii(path, env, options):

    non_ascii_count = 0
    for root, dirs, files in os.walk(path):
        for dir in dirs:
            non_ascii_count += find_non_ascii(os.path.join(root, dir), env, options)

        for file in [f for f in files if f.endswith(".js")]:
            filepath = os.path.join(root, file)
            data = open(filepath)
            line = 0
            for l in data:
                line += 1
                char = 0
                try:
                    for s in list(unicode(l,'utf-8')):
                        char += 1
                        try:
                            s.encode('ascii')
                        except:
                            print '%s: Non ASCII character at line:%s char:%s' % (filepath,line,char)
                            non_ascii_count += 1
                except UnicodeDecodeError as e:
                    print '%s: Non ASCII character at line:%s char:%s' % (filepath,line,char)
                    non_ascii_count += 1
            data.close()

    return non_ascii_count

def main():

    result = 0
    env = {}

    templates = ['app']
    shaders = [] # Ignore temporarily ['draw2D']

    parser = OptionParser()

    parser.add_option('--clean', action='store_true', \
                        default=False, \
                        help="Only builds")
    parser.add_option('--clean-only', action='store_true', \
                        default=False, \
                        help="Only cleans")
    parser.add_option('--code-only', action='store_true', default=False,
                      help="Build only the game code")
    parser.add_option('--find-non-ascii', action='store_true', default=False, help="Searches for non ascii characters in the scripts")
    parser.add_option('--development', action='store_true', \
                        help="Only builds the development build")
    parser.add_option('--verbose', action='store_true', \
                        help="Prints additional information about the build process")
    (options, args) = parser.parse_args()

    if not configure(env, options):
        result = 1
        print 'Failed to configure build'
        return result

    if options.find_non_ascii:
        result = find_non_ascii(env['APP_SCRIPTS'], env, options)
        if result != 0:
            print "Found non-ascii character in script"
        else:
            print "Only ASCII found!"
        return result

    # Clean only
    if options.clean_only:
        result = clean(env, options)
        if result != 0:
            print 'Failed to clean build'
        else:
            print 'Cleaned'
        return result

    # Clean build first
    if options.clean:
        result = clean(env, options)
        if result != 0:
            print 'Failed to clean build'
            return result

        print 'Cleaned'

    # Asset build
    if len(args) > 0:
        files = args
    else:

        if not options.code_only:

            print ""
            print "----------------------------------------------------------"
            print "   ASSET BUILD (may be slow - disable with --code-only)"
            print "----------------------------------------------------------"
            print ""

            # Mapping table

            if not os.path.exists('staticmax'):
               os.makedirs('staticmax')
            (mapping_table_obj, build_deps) = gen_mapping('assets', 'staticmax')

            # Write mapping table

            with open('mapping_table.json', 'wb') as f:
                json_dump(mapping_table_obj, f, separators=(',', ':'))

            # Build all asset files

            # print "Deps: %s" % build_deps

            for src in build_deps:
                dest = build_deps[src]
                print "Building %s -> %s" % (src, dest)

                result = do_build(src, dest, env, options)
                if result:
                    print "Build failed"
                    exit(1)

        # Code

        print ""
        print "----------------------------------------------------------"
        print "                   CODE BUILD"
        print "----------------------------------------------------------"
        print ""

        code_files = glob.glob('templates/*.js')
        # print "CODE FILES: %s" % code_files

        for f in code_files:
            print " APP: %s" % f
            (code_base, code_ext) = os.path.splitext(os.path.split(f)[1])

            code_dests = [ code_base + ".canvas.debug.html",

                           code_base + ".canvas.release.html",
                           code_base + ".canvas.js",

                           code_base + ".debug.html",

                           code_base + ".release.html",
                           code_base + ".tzjs" ]

            # print "  CODE:FILES: %s" % code_dests

            for dest in code_dests:
                do_build_code(dest, env, options)

        print "DONE"
        exit(0)

        # files = []
        # for s in shaders:
        #     files.append('%s.cgfx' % s)

        # result = build(files, env, options)
        # if result == 0:
        #     print 'Built Assets'
        # else:
        #     print 'Failed to build assets'
        #     return result

    # if yaml2json('mapping_table', 'mapping_table', True, env, options) == 0:
    #     print 'Built Mapping Table'
    # else:
    #     print 'Failed Mapping Table'

    if len(args) > 0:
        files = args
    else:
        files = []
        for t in templates:
            if options.development:
                if env['SDK_VERSION'] < StrictVersion('0.19.0'):
                    files.append('%s.jsinc' % t)
                    files.append('%s.development.html' % t)
                else:
                    files.append('%s.debug.html' % t)
                    files.append('%s.canvas.debug.html' % t)
            else:
                if env['SDK_VERSION'] < StrictVersion('0.19.0'):
                    files.append('%s.jsinc' % t)
                    files.append('%s.development.html' % t)
                    files.append('%s.release.html' % t)
                    files.append('%s.tzjs' % t)
                else:
                    # Order is important
                    files.append('%s.debug.html' % t)
                    files.append('%s.default.debug.html' % t)

                    files.append('%s.canvas.debug.html' % t)
                    files.append('%s.canvas.default.debug.html' % t)

                    files.append('%s.tzjs' % t)
                    files.append('%s.release.html' % t)

                    files.append('%s.canvas.js' % t)
                    files.append('%s.canvas.release.html' % t)

    result = build(files, env, options)
    if result == 0:
        print 'Built Templates'
    else:
        print 'Failed Templates'

    return result

if __name__ == "__main__":
    exit(main())
