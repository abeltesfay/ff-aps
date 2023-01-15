# TODO Notes: Must be DEFLATE zip algorithm; can't be TAR-ed.

echo
echo STARTING: Creating new compressed extension file....

# TODO This hasn't been tested; may need p7zip-full package
7z a -tzip output/ff-aps-ext-v1.2.zip fancy_searchbox.js icons/ manifest.json

# Alternative: May be able to use zip command: https://linuxize.com/post/how-to-zip-files-and-directories-in-linux/
# zip -q output/ff-aps-ext-v1.2.zip fancy_searchbox.js icons/ manifest.json

# echo
# echo SUCCESS: File has been compressed into a zip called ff-aps-ext.zip that can be loaded under Firefox add-ons!
# echo
