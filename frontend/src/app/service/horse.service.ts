import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import {Horse} from '../dto/horse';
import {Sex} from '../dto/sex';

const baseUri = environment.backendUrl + '/horses';

@Injectable({
  providedIn: 'root'
})
export class HorseService {
  private params: any;

  constructor(
    private http: HttpClient,
  ) { }

  /**
   * Get all horses stored in the system
   *
   * @return observable list of found horses.
   */
  getAll(): Observable<Horse[]> {
    return this.http.get<Horse[]>(baseUri);
  }

  /**
   * Get all horses stored in the system matching the parameters
   *
   * @return observable list of found horses.
   */
  getAllParam(params: HttpParams): Observable<Horse[]> {
    return this.http.get<Horse[]>(baseUri, {params});
  }

  /**
   * Create a new horse in the system.
   *
   * @param horse the data for the horse that should be created
   * @return an Observable for the created horse
   */
  create(horse: Horse): Observable<Horse> {
    return this.http.post<Horse>(
      baseUri,
      horse
    );
  }

  /**
   * Edit an existing horse
   *
   * @param 'id'id of horse to edit
   * @horse the new horse details
   */

  editHorse(id: number, horse: Horse) {
    return this.http.put<Horse>(baseUri + '/' + id, horse);
  }

  getByID(id: number): Observable<Horse> {
    return this.http.get<Horse>(baseUri + '/' + id);
  }

  deleteHorse(id: number): Observable<Horse> {
      return this.http.delete<Horse>(baseUri + '/' + id);
  }
}
