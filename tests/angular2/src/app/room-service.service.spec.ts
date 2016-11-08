/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SDKModule } from './shared/sdk';
import { Room, Category, Message, FireLoopRef } from './shared/sdk/models';
import { RoomApi, CategoryApi, MessageApi, RealTime } from './shared/sdk/services';

describe('Service: Room Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SDKModule.forRoot()
      ]
    });
  });

  it('should contain persisted model methods',
    async(inject([RoomApi], (service: RoomApi) => {
      expect(service).toBeTruthy();
      expect(service.create).toBeTruthy();
      expect(service.updateAll).toBeTruthy();
      expect(service.updateAttributes).toBeTruthy();
      expect(service.find).toBeTruthy();
      expect(service.findById).toBeTruthy();
      expect(service.findOne).toBeTruthy();
    })
  ));


  it('should listen for child_added using FireLoop API',
    inject([RealTime], (realTime: RealTime) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let ref: FireLoopRef<Room> = realTime.FireLoop.ref<Room>(Room);
      let subscription = ref.on('child_added').subscribe((result: Room) => {
        console.log(result);
        expect(result.id).toBeTruthy();
        expect(result.name).toBe(room.name);
        subscription.unsubscribe();
      });
      ref.create(room).subscribe();
    })
  );

  it('should listen for child_changed using FireLoop API',
    inject([RealTime], (realTime: RealTime) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let name2 = room.name + 'SSSS';
      let ref: FireLoopRef<Room> = realTime.FireLoop.ref<Room>(Room);
      let subscription = ref.on('child_changed').subscribe((result: Room) => {
        expect(result.id).toBeTruthy();
        expect(result.name).toBe(name2);
        subscription.unsubscribe();
      });
      ref.create(room).subscribe((res: Room) => {
        res.name = name2;
        ref.upsert(res).subscribe();
      });
    })
  );

  it('should listen for child_removed using FireLoop API',
    inject([RealTime], (realTime: RealTime) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let ref: FireLoopRef<Room> = realTime.FireLoop.ref<Room>(Room);
      let subscription = ref.on('child_removed').subscribe((result: Room) => {
        console.log(result);
        expect(result.id).toBeTruthy();
        expect(result.name).toBe(room.name);
        subscription.unsubscribe();
      });
      ref.create(room).subscribe((result: Room) => ref.remove(result).subscribe());
    })
  );

  it('should set data using FireLoop API',
    inject([RealTime], (realTime: RealTime) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let ref: FireLoopRef<Room> = realTime.FireLoop.ref<Room>(Room);
      let subscription = ref.create(room).subscribe((result: Room) => {
        expect(result.id).toBeTruthy();
        expect(result.name).toBe(room.name);
        subscription.unsubscribe();
      });
    })
  );

  it('should create child data using FireLoop API',
    inject([RealTime], (realTime: RealTime) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let message: Message = new Message({  text : 'Hello Child Reference' });
      let RoomReference: FireLoopRef<Room> = realTime.FireLoop.ref<Room>(Room);
      let RoomSubscription = RoomReference.create(room).subscribe((instance: Room) => {
         // Child Feature
      let MessageReference: FireLoopRef<Message> = RoomReference.make(instance).child<Message>('messages');
          MessageReference.on('child_added').subscribe((result: Message) => {
            expect(result.id).toBeTruthy();
            expect(result.text).toBe(message.text);
          }
        );
        MessageReference.create(message).subscribe((res: Message) => console.log(res.text));
      });
    })
  );

  it('should create a new room instance',
    async(inject([RoomApi], (roomApi: RoomApi) => {

      let room: Room = new Room();
      room.name = Date.now().toString();

      return roomApi.create(room)
        .subscribe((instance: Room) => expect(instance.id).toBeTruthy());
    })
  ));

  it('should find room instance by id',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      return roomApi.create(room)
        .subscribe((createdRoom: Room) => {
          expect(createdRoom.id).toBeTruthy();
          roomApi.findById(createdRoom.id)
            .subscribe((foundRoom: Room) => expect(foundRoom.id).toBe(createdRoom.id));
        });
    })
  ));

  it('should create a room message',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      return roomApi.create(room).subscribe((instance: Room) =>
        roomApi.createMessages(instance.id, {
          text: 'HelloRoom'
        }).subscribe(message => {
          expect(message.id).toBeTruthy();
          expect(message.roomId).toBe(instance.id);
        })
      );
    })
  ));

  it('should create and find a room message using loopback query filter (Interface Test)',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let room: Room = new Room();
      room.name = Date.now().toString();
      let message = { text: 'Hello Room with Query' };
      return roomApi.create(room)
        .subscribe((instance: Room) => roomApi.createMessages(instance.id, message)
        .subscribe(messageInstance => roomApi.getMessages(instance.id, { where: message })
        .subscribe(messages => {
          expect(messages.length).toBe(1);
          let msg = messages.pop();
          expect(msg.text).toBe(messageInstance.text);
        })));
    })
  ));

  it('should fetch greetings from route params',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let params = ['Hi', 'My Name Is', 'What'];
      return roomApi.greetRoute(params[0], params[1], params[2])
        .subscribe((result: { greeting: string }) => {
          expect(result.greeting).toBe(params.join(':'));
        });
    })
  ));

  it('should fetch greetings from get method',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let params = ['Hi', 'My Name Is', 'Who'];
      return roomApi.greetGet(params[0], params[1], params[2])
        .subscribe((result: { greeting: string }) => {
          expect(result.greeting).toBe(params.join(':'));
        });
    })
  ));

  it('should fetch greetings from post method',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let params = ['Hi', 'My Name Is', 'Slim Shady!!'];
      return roomApi.greetPost(params[0], params[1], params[2])
        .subscribe((result: { greeting: string }) => {
          expect(result.greeting).toBe(params.join(':'));
        });
    })
  ));

  it('should find by mock room to test custom remote method',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let room = new Room({ id: 42, name: 'my awesome room' });
      return roomApi.findByRoom(room)
        .subscribe((instance: Room) => {
          expect(room.id).toBe(instance.id);
        });
    })
  ));

  it('should fetch filter as object from single-param post method',
    async(inject([RoomApi], (roomApi: RoomApi) => {
      let param = { child: 'filtered' };
      return roomApi.singleParamPost(param).subscribe((result: { child: string, param: undefined }) => {
        expect(result.param).toBe(undefined);
        expect(result.child).toBe(param.child);
      });
    })
  ));

  it('should create and link rooms with categories',
    async(inject([CategoryApi, RoomApi], (categoryApi: CategoryApi, roomApi: RoomApi) => {
      let category: Category = new Category();
      let room: Room = new Room();
      room.name = Date.now().toString();
      category.name = Date.now().toString();

      return roomApi.create(room)
        .subscribe((roomInstance: Room) => categoryApi.create(category)
        .subscribe((categoryInstance: Category) => categoryApi.linkRooms(categoryInstance.id, roomInstance.id)
        .subscribe((result: any) => {
          expect(result.id).toBeTruthy();
        })));
    })
  ));

  it('should include multiple layers',
    async(inject([RoomApi, MessageApi], (roomApi: RoomApi, messageApi: MessageApi) => {
      let room: Room = new Room({ name: Date.now().toString() });
      let message = new Message({ text: 'Hello Room' });
      let reply = new Message({ text: 'Hello Reply' });
      return roomApi.create(room)
        .subscribe((instance: Room) => roomApi.createMessages(instance.id, message)
        .subscribe((messageInstance: Message) => messageApi.createReplies(messageInstance.id, reply)
        .subscribe((replyInstance: Message) => messageApi.createLikes(replyInstance.id, { set: true })
        .subscribe((likeInstance: any) => roomApi.find({
          where: { id: instance.id },
          include: {
            relation: 'messages',
            scope: {
              include: {
                relation: 'replies',
                scope: {
                  include: {
                    relation: 'likes'
                  }
                }
              }
            }
          }
        }).subscribe((result: Room[]) => {
          expect(result.length).toBe(1);
          expect(result[0].messages.length).toBe(1);
          expect(result[0].messages[0].replies.length).toBe(1);
          expect(result[0].messages[0].replies[0].likes.length).toBe(1);
        })))));
    })
  ));
});
