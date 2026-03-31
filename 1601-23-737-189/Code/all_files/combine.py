import os
import re

base_dir = r"C:\Users\sruja\Documents\BDA-Flink+Kafka"
main_file = os.path.join(base_dir, "Full_Report.tex")

with open(main_file, "r", encoding="utf-8") as f:
    content = f.read()

def replace_input(match):
    filepath = match.group(1).replace("\\", "/") + ".tex"
    full_path = os.path.join(base_dir, filepath)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as section_file:
            return "% --- Start of " + filepath + " ---\n" + section_file.read() + "\n% --- End of " + filepath + " ---\n"
    return match.group(0)

# Replace \input{...}
combined_content = re.sub(r'\\input\{([^}]+)\}', replace_input, content)

# Save the combined content
with open(main_file, "w", encoding="utf-8") as f:
    f.write(combined_content)

print("Combined successfully into Full_Report.tex")
