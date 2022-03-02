@echo[
@echo STARTING: Creating new compressed file ff-aps.zip....

@tar -ac --exclude .git,ff-aps.zip -f ff-aps.zip *

@echo[
@echo SUCCESS: File has been compressed into a zip called ff-aps.zip that can be loaded under Firefox add-ons!
@echo[
@pause