# These are the rules all tasks within this "tasks" folder must follow

## Guidelines File

Specific instructions can be passed by using the third argument: $3. It designates the file to look for the guidelines (guidelines.md) file for this type of task.
Also look at any updates in the code before creating tests.

## Naming Convention

Format: ###-test-[the-task-name].md
Example: 001-test-stepper-registration.md

## Sections

- Task checklist

  A checklist of steps to take for that task. After each task, the task list steps must be checked.
  If a clarification is needed add for a task [STILL UNCERTAIN]
  Ask for review of all uncertainties before proceeding
  IMPORTANT:

  - Do not create more than 10 test cases
  - Mark any uncertainties in the checklist as [UNCERTAIN]

- File structure modifications

  The Task will show all the paths that will need to be updated.
  Group them by BEFORE and AFTER for a readable report.

# Writing style and constraints to follow when implementing

Do not plan for more than 10 test cases in one task.
Use short names for tests such as "registers many unrelated Pulses correctly".
Also the test name in the test file must be numbered such as to be easily picked up if passing -t flag to the jest command.
