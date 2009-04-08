require 'rubygems'
require 'zip/zip'

class PackageGenerator
  attr_reader :root_dir

  def initialize(root_dir)
    @root_dir = root_dir
  end
  
  def generate
    delete_previous
    copy_files
    process_code
    pack_js
    minify_js
    compress
  ensure
    clean_up
  end
  
  def delete_previous
    FileUtils.rm zip_file if File.exist? zip_file
  end
  
  def copy_files
    FileUtils.mkdir package_dir
    FileUtils.cp root_files("date_input.css", "LICENCE", "README", "CHANGELOG"), package_dir
  end
  
  def process_code
    code = File.read(root_file(plugin_file))
    
    code.gsub!(/\/\/[^\n]+/,  "") # Remove any other '//' comments (without deleting the line)
    code.gsub!(/\/\*.+\*\//m, "") # Remove '/* */' comments
    
    code.gsub!(/(\n +\n)( +\n)+/) { $1 } # Remove any multiple empty lines
    
    open(package_file(plugin_file), "w") do |file|
      file << header
      file << code
    end
  end
  
  def pack_js
    open(package_file(plugin_file("pack")), "w") do |file|
      file << `#{root_file("bin/packer")} #{root_file(plugin_file)}`
    end
  end
  
  def minify_js
    open(package_file(plugin_file("min")), "w") do |file|
      file << `java -jar #{root_file("bin/yuicompressor-2.2.5.jar")} #{root_file(plugin_file)} 2>/dev/null`
    end
  end
  
  def compress
    Zip::ZipFile.open(zip_file, Zip::ZipFile::CREATE) do |zip|
      zip.mkdir(code_name)
      Dir[package_file("*")].each do |file|
        zip.add(code_name + "/" + File.basename(file), file)
      end
    end
    
    puts "Generated #{zip_file}"
  end
  
  def clean_up
    FileUtils.rm_r package_dir if File.exist? package_dir
  end
  
  private
  
    def package_dir
      root_dir + "/package"
    end
  
    def zip_file
      root_dir + "/" + code_name + "-" + metadata[:version] + ".zip"
    end
    
    def code_name
      metadata[:name].downcase.gsub(" ", "_")
    end
    
    def metadata
      load_metadata unless self.class.const_defined? :Metadata
      Hash.new do |hash, key|
        eval("Metadata::" + key.to_s.upcase) rescue nil
      end
    end
    
    def load_metadata
      self.class.class_eval <<-STR
        class Metadata
          #{File.read(root_file("metadata.rb"))}
        end
      STR
    end
    
    def root_files(*files)
      files.map { |file| root_file(file) }
    end
    
    def root_file(file)
      root_dir + "/" + file
    end
    
    def package_file(file)
      package_dir + "/" + file
    end
    
    def plugin_file(type = nil)
      "jquery.#{code_name}#{"." + type if type}.js"
    end
    
    def header
      header = "/*\n"
      header << metadata[:name] + " " + metadata[:version] + "\n"
      header << "Requires jQuery version: " + metadata[:jquery] + "\n"
      unless metadata[:plugins].nil? || metadata[:plugins].empty?
        header << "Requires plugins:" + "\n"
        metadata[:plugins].each do |plugin, url|
          header << "  * #{plugin} - #{url}\n"
        end
      end
      header << "\n" + File.read(root_file("LICENCE")) + "*/\n\n"
    end
end

desc "Package the plugin into a zip file which can be distributed"
task :package do
  PackageGenerator.new(File.dirname(__FILE__)).generate
end
