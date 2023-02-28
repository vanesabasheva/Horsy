import {Component, OnInit} from '@angular/core';
import {NgForm, NgModel} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {Observable, of} from 'rxjs';
import {Horse} from 'src/app/dto/horse';
import {Owner} from 'src/app/dto/owner';
import {Sex} from 'src/app/dto/sex';
import {HorseService} from 'src/app/service/horse.service';
import {OwnerService} from 'src/app/service/owner.service';


export enum HorseCreateEditMode {
  create,
  edit,
};

@Component({
  selector: 'app-horse-create-edit',
  templateUrl: './horse-create-edit.component.html',
  styleUrls: ['./horse-create-edit.component.scss']
})
export class HorseCreateEditComponent implements OnInit {

  mode: HorseCreateEditMode = HorseCreateEditMode.create;
  horse: Horse = {
    name: '',
    description: '',
    dateOfBirth: new Date(),
    sex: Sex.female,
  };


  constructor(
    private service: HorseService,
    private ownerService: OwnerService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: ToastrService,
  ) {
  }

  public get heading(): string {
    switch (this.mode) {
      case HorseCreateEditMode.create:
        return 'Create New Horse';
      case HorseCreateEditMode.edit:
        return 'Edit Horse';
      default:
        return '?';
    }
  }

  public get submitButtonText(): string {
    switch (this.mode) {
      case HorseCreateEditMode.create:
        return 'Create';
      case HorseCreateEditMode.edit:
        return 'Save';
      default:
        return '?';
    }
  }

  get modeIsCreate(): boolean {
    return this.mode === HorseCreateEditMode.create;
  }


  private get modeActionFinished(): string {
    switch (this.mode) {
      case HorseCreateEditMode.create:
        return 'created';
      case HorseCreateEditMode.edit:
        return 'edited';
      default:
        return '?';
    }
  }

  ownerSuggestions = (input: string) => (input === '')
    ? of([])
    : this.ownerService.searchByName(input, 5);

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.mode = data.mode;
    });

    if (this.mode === HorseCreateEditMode.edit) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id != null) {
        this.getHorse(Number(id));
      }
    }
  }

  public dynamicCssClassesForInput(input: NgModel): any {
    return {
      // This names in this object are determined by the style library,
      // requiring it to follow TypeScript naming conventions does not make sense.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'is-invalid': !input.valid && !input.pristine,
    };
  }

  public formatOwnerName(owner: Owner | null | undefined): string {
    return (owner == null)
      ? ''
      : `${owner.firstName} ${owner.lastName}`;
  }


  public onSubmit(form: NgForm): void {
    console.log('is form valid?', form.valid, this.horse);
    if (form.valid) {
      if (this.horse.description === '') {
        delete this.horse.description;
      }

      let observable: Observable<Horse>;
      switch (this.mode) {
        case HorseCreateEditMode.create:
          // create horse mode
          observable = this.service.create(this.horse);
          break;

        case HorseCreateEditMode.edit:
          const id = Number(this.route.snapshot.paramMap.get('id'));
          observable = this.service.editHorse(id, this.horse);
          break;

        default:
          console.error('Unknown HorseCreateEditMode', this.mode);
          return;
      }
      observable.subscribe({
        next: data => {
          this.notification.success(`Horse ${this.horse.name} successfully ${this.modeActionFinished}.`);
          this.router.navigate(['/horses']);
        },
        error: error => {
          console.error('Error creating horse', error);
          // TODO show an error message to the user. Include and sensibly present the info from the backend!
        }
      });
    }
  }

  private getHorse(id: number) {
    this.service.getByID(id).subscribe({
      next: (data: Horse) => {
        this.horse = data;
      },
      error: (error: any) => {
        console.error('Error editing horse', error);
      }
    });
  }

  private goToDetailPage(horse: Horse) {
    this.router.navigate(['horses/' + horse.id]).then(r => {
      if (!r) {
        console.error('Router failed');
      }
    });
  }
  private deleteHorse(id: number) {
    this.service.deleteHorse(id).subscribe({
      next: data => {
        this.notification.success(`Horse ${this.horse.name} successfully deleted`);
        this.router.navigate(['/horses'], {state : {del: 'true'}}).then(r => {
          if (!r) {
            this.showError('Router failed');
          }
        });
      },
      error: error => {
        console.error(error.message);
        this.showError('Failed to delete horse: ' + error.error.message);
      }
    });
  }

  private showMessage(message: string): void {
    // Add code to show a success message to the user, e.g., using a snackbar or toast notification
    console.log(`Success: ${message}`);
  }

  private showError(message: string): void {
    // Add code to show an error message to the user, e.g., using a snackbar or toast notification
    console.error(`Error: ${message}`);
  }

}
