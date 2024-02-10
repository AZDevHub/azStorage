#!/bin/bash

# Remove temp files from TS directories
#!/bin/bash

# Initialize an empty array
folders=()

# Find directories containing 'node_modules', 'dist', 'package-lock.json', or 'local.settings.json'
# and add them to the folders array
while IFS= read -r -d '' folder; do
    folders+=("$folder")
done < <(find . -type d \( -name "node_modules" -o -name "dist" \) -exec dirname {} \; -print0 | sort -uz)

while IFS= read -r -d '' file; do
    folders+=("$(dirname "$file")")
done < <(find . -type f \( -name "package-lock.json" -o -name "local.settings.json" \) -print0 | sort -uz)

# Remove duplicate entries in folders array
readarray -t folders < <(printf '%s\n' "${folders[@]}" | awk '!a[$0]++')

# Iterate through the folders array
for folder in "${folders[@]}"
do
    echo "Processing $folder"
    cd "$folder"

    if [ -d "node_modules" ]
    then
    # Delete node_modules folder
    rm -rf node_modules
    echo "node_modules folder deleted from $folder"
    fi

    if [ -d "dist" ]
    then
    # Delete node_modules folder
    rm -rf dist
    echo "dist folder deleted from $folder"
    fi


    if [ -f "package-lock.json" ]
    then
    # Delete package-lock.json file
    rm -f package-lock.json
    echo "package-lock.json file deleted from $folder"
    fi

    if [ -f "local.settings.json" ]
    then
    # Delete local.settings.json file
    rm -f local.settings.json
    echo "local.settings.json file deleted from $folder"
    fi

    cd ..
    cd - > /dev/null
done

echo "Script execution complete."