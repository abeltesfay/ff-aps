@REM Need to zip using DEFLATE

@echo[
@echo STARTING: Creating new compressed extension file....

@del /Q output\ff-aps-ext.zip
7z a -tzip output\ff-aps-ext.zip fancy_searchbox.js icons\ manifest.json

@echo[
@echo SUCCESS: File has been compressed into a zip called ff-aps-ext.zip that can be loaded under Firefox add-ons!
@echo[
@REM @pause