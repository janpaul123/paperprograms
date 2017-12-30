project('tutorial', 'c', 'cpp', default_options : ['c_std=c11', 'cpp_std=c++11'])
src = ['demo.cpp']
opencv = dependency('opencv')
json_sp = subproject('json')
executable('demo', sources : src, dependencies : [opencv, json_sp.get_variable('nlohmann_json_dep')])
